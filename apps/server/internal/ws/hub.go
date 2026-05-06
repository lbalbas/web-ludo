package ws

import (
	"encoding/json"
	"log"
	"math/rand"
	"strconv"

	"web-ludo-server/internal/game"
)

type ClientMessage struct {
	Client  *Client
	Message []byte
}

type Hub struct {
	// Registered clients.
	Clients map[*Client]bool

	// Inbound messages from the clients.
	Incoming chan *ClientMessage

	// Register requests from the clients.
	Register chan *Client

	// Unregister requests from clients.
	Unregister chan *Client

	// The overarching GameState for this basic single-match hub.
	// Later we can scale to multiple hubs/matches.
	GameState *game.GameState

	// Sessions map client session IDs to player colors.
	Sessions map[string]game.PlayerColor
}

func NewHub() *Hub {
	return &Hub{
		Incoming:   make(chan *ClientMessage),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[*Client]bool),
		GameState:  game.CreateInitialGameState("global-match"),
		Sessions:   make(map[string]game.PlayerColor),
	}
}

// availableColors are the Ludo player colors in seat order.
var availableColors = []game.PlayerColor{game.ColorRed, game.ColorGreen, game.ColorYellow, game.ColorBlue}

// nextAvailableColor returns the first color that is not yet taken by any
// player in the game state. Returns empty string if the game is full.
func (h *Hub) nextAvailableColor() game.PlayerColor {
	taken := make(map[game.PlayerColor]bool)
	for _, p := range h.GameState.Players {
		taken[p.Color] = true
	}
	for _, c := range availableColors {
		if !taken[c] {
			return c
		}
	}
	return ""
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			//Check if the client is already registered (via session ID)
			if _, ok := h.Sessions[client.SessionID]; ok {
				//Assign same color to the client
				client.Color = string(h.Sessions[client.SessionID])
				client.PlayerID = string(h.Sessions[client.SessionID]) + "-player"
				h.Clients[client] = true
				h.sendTo(client, Event{
					Type:    "PLAYER_ASSIGNED",
					Payload: json.RawMessage(`{"color":"` + client.Color + `", "sessionId":"` + client.SessionID + `"}`),
				})
				h.broadcastState()
				continue
			}
			color := h.nextAvailableColor()
			if color == "" {
				// Game is full — reject the client.
				log.Printf("Game full, rejecting client")
				h.sendTo(client, Event{
					Type:    "ERROR",
					Payload: json.RawMessage(`{"message":"Game is full"}`),
				})
				close(client.Send)
				continue
			}

			// Assign identity to the client.
			client.Color = string(color)
			client.PlayerID = string(color) + "-player"
			client.SessionID = strconv.Itoa(int(rand.Uint32()))
			h.Clients[client] = true

			// Add player to game state.
			h.GameState.Players = append(h.GameState.Players, game.PlayerData{
				Color: color,
				ID:    client.PlayerID,
			})

			log.Printf("Player joined as %s (%d/%d)", color, len(h.GameState.Players), len(availableColors))

			// Tell this specific client what color they are.
			h.sendTo(client, Event{
				Type:    "PLAYER_ASSIGNED",
				Payload: json.RawMessage(`{"color":"` + string(color) + `", "sessionId":"` + client.SessionID + `"}`),
			})
			h.Sessions[client.SessionID] = color
			// Broadcast updated state to everyone.
			h.broadcastState()

		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)

				// Remove the player from the game state.
				h.removePlayer(game.PlayerColor(client.Color))

				log.Printf("Player %s left (%d/%d)", client.Color, len(h.GameState.Players), len(availableColors))

				// If no players remain, reset the game.
				if len(h.GameState.Players) == 0 {
					h.GameState = game.CreateInitialGameState("global-match")
					h.Sessions = make(map[string]game.PlayerColor)
					log.Println("All players left — game reset")
				} else {
					// If it was this player's turn, advance to the next player still in the game.
					if game.PlayerColor(client.Color) == h.GameState.CurrentTurn {
						h.GameState.DiceValue = nil
						h.advanceTurnToActivePlayer()
					}
					h.broadcastState()
				}
			}

		case msg := <-h.Incoming:
			h.handleMessage(msg)
		}
	}
}

// removePlayer removes a player by color from the GameState.Players slice.
func (h *Hub) removePlayer(color game.PlayerColor) {
	filtered := make([]game.PlayerData, 0, len(h.GameState.Players))
	for _, p := range h.GameState.Players {
		if p.Color != color {
			filtered = append(filtered, p)
		}
	}
	h.GameState.Players = filtered
}

// advanceTurnToActivePlayer moves CurrentTurn forward until it lands on a
// color that has a player still in the game. If no players remain it does nothing.
func (h *Hub) advanceTurnToActivePlayer() {
	if len(h.GameState.Players) == 0 {
		return
	}
	activeColors := make(map[game.PlayerColor]bool)
	for _, p := range h.GameState.Players {
		activeColors[p.Color] = true
	}
	// Walk the turn order until we find an active player (at most 4 steps).
	for i := 0; i < 4; i++ {
		next := game.GetNextTurn(h.GameState.CurrentTurn)
		h.GameState.CurrentTurn = next
		if activeColors[next] {
			return
		}
	}
}

func (h *Hub) handleMessage(clientMsg *ClientMessage) {
	var event Event
	err := json.Unmarshal(clientMsg.Message, &event)
	if err != nil {
		log.Printf("error unmarshaling event: %v", err)
		return
	}

	clientColor := game.PlayerColor(clientMsg.Client.Color)

	switch event.Type {
	case "ROLL_DICE":
		// Only the current-turn player may roll.
		if clientColor != h.GameState.CurrentTurn {
			log.Printf("Ignoring ROLL_DICE from %s (current turn: %s)", clientColor, h.GameState.CurrentTurn)
			return
		}
		h.GameState.RollDice()
		h.broadcastState()

	case "MOVE_PIECE":
		// Only the current-turn player may move.
		if clientColor != h.GameState.CurrentTurn {
			log.Printf("Ignoring MOVE_PIECE from %s (current turn: %s)", clientColor, h.GameState.CurrentTurn)
			return
		}
		// Payload should be {"pieceId": "red-0"}
		payloadBytes, _ := json.Marshal(event.Payload)
		var movePayload struct {
			PieceID string `json:"pieceId"`
		}
		if err := json.Unmarshal(payloadBytes, &movePayload); err == nil {
			h.GameState.MovePiece(movePayload.PieceID)
			h.broadcastState()
		}
	}
}

// sendTo sends a single event to one specific client.
func (h *Hub) sendTo(client *Client, event Event) {
	eventBytes, err := json.Marshal(event)
	if err != nil {
		return
	}
	select {
	case client.Send <- eventBytes:
	default:
	}
}

func (h *Hub) broadcastState() {
	// Serialize game state
	stateBytes, err := json.Marshal(h.GameState)
	if err != nil {
		return
	}

	event := Event{
		Type:    "SYNC_STATE",
		Payload: json.RawMessage(stateBytes),
	}

	eventBytes, err := json.Marshal(event)
	if err != nil {
		return
	}

	for client := range h.Clients {
		select {
		case client.Send <- eventBytes:
		default:
			close(client.Send)
			delete(h.Clients, client)
		}
	}
}
