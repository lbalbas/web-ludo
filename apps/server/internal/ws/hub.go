package ws

import (
	"encoding/json"
	"log"

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
}

func NewHub() *Hub {
	return &Hub{
		Incoming:   make(chan *ClientMessage),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[*Client]bool),
		GameState:  game.CreateInitialGameState("global-match"),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true
			h.broadcastState()

		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
			}

		case msg := <-h.Incoming:
			h.handleMessage(msg)
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

	switch event.Type {
	case "ROLL_DICE":
		h.GameState.RollDice()
		h.broadcastState()

	case "MOVE_PIECE":
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
