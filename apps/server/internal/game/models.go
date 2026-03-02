package game

import "strconv"

type PlayerColor string
type PieceStatus string

const (
	ColorRed    PlayerColor = "red"
	ColorGreen  PlayerColor = "green"
	ColorYellow PlayerColor = "yellow"
	ColorBlue   PlayerColor = "blue"

	StatusHome     PieceStatus = "home"
	StatusPath     PieceStatus = "path"
	StatusHomePath PieceStatus = "home-path"
	StatusFinished PieceStatus = "finished"
)

type PieceData struct {
	ID       string      `json:"id"`
	Color    PlayerColor `json:"color"`
	Status   PieceStatus `json:"status"`
	Position int         `json:"position"`
}

type PlayerData struct {
	Color PlayerColor `json:"color"`
	ID    string      `json:"id"`
	IsBot bool        `json:"isBot,omitempty"`
}

type GameState struct {
	ID          string               `json:"id"`
	Players     []PlayerData         `json:"players"`
	Pieces      map[string]PieceData `json:"pieces"`
	CurrentTurn PlayerColor          `json:"currentTurn"`
	DiceValue   *int                 `json:"diceValue"`
	Status      string               `json:"status"`
}

func CreateInitialGameState(id string) *GameState {
	pieces := make(map[string]PieceData)
	colors := []PlayerColor{ColorRed, ColorGreen, ColorYellow, ColorBlue}

	for _, color := range colors {
		for i := 0; i < 4; i++ {
			// e.g. "red-0"
			pieceID := string(color) + "-" + strconv.Itoa(i)
			pieces[pieceID] = PieceData{
				ID:       pieceID,
				Color:    color,
				Status:   StatusHome,
				Position: i,
			}
		}
	}

	return &GameState{
		ID:          id,
		Players:     []PlayerData{},
		Pieces:      pieces,
		CurrentTurn: ColorRed,
		DiceValue:   nil,
		Status:      "playing",
	}
}
