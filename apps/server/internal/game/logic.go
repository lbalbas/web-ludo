package game

import (
	"math/rand"
)

var HomeEntryPositions = map[PlayerColor]int{
	ColorRed:    50,
	ColorGreen:  11,
	ColorYellow: 24,
	ColorBlue:   37,
}

var SafePositions = []int{0, 8, 13, 21, 26, 34, 39, 47}

func GetNextTurn(currentTurn PlayerColor) PlayerColor {
	turnOrder := []PlayerColor{ColorRed, ColorGreen, ColorYellow, ColorBlue}
	for i, color := range turnOrder {
		if color == currentTurn {
			return turnOrder[(i+1)%len(turnOrder)]
		}
	}
	return ColorRed
}

// RollDice generates a dice value for the current player.
// If the player has no pieces on the board and didn't roll a 6, the turn is immediately skipped.
func (state *GameState) RollDice() {
	if state.DiceValue != nil {
		return
	}

	val := rand.Intn(6) + 1
	state.DiceValue = &val

	hasPiecesOut := false
	for _, p := range state.Pieces {
		if p.Color == state.CurrentTurn && p.Status != StatusHome {
			hasPiecesOut = true
			break
		}
	}

	if val != 6 && !hasPiecesOut {
		// No valid moves: clear the roll and skip to the next player immediately.
		// The frontend will still receive the dice value from the previous broadcast
		// before the skip broadcast arrives, giving the player a moment to see the roll.
		state.DiceValue = nil
		state.CurrentTurn = GetNextTurn(state.CurrentTurn)
	}
}


func contains(slice []int, item int) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func (state *GameState) handleCollisions(targetPosition int, targetStatus PieceStatus, movingPiece PieceData) {
	for id, targetPiece := range state.Pieces {
		if targetPiece.Status == targetStatus && targetPiece.Position == targetPosition && targetPiece.ID != movingPiece.ID {
			if targetPiece.Color != movingPiece.Color {
				if targetStatus == StatusPath && contains(SafePositions, targetPosition) {
					continue
				}

				// Find available home index
				occupiedHomeIndices := make(map[int]bool)
				for _, p := range state.Pieces {
					if p.Color == targetPiece.Color && p.Status == StatusHome {
						occupiedHomeIndices[p.Position] = true
					}
				}
				
				freeHomeIndex := 0
				for i := 0; i < 4; i++ {
					if !occupiedHomeIndices[i] {
						freeHomeIndex = i
						break
					}
				}

				// Capture
				capturedPiece := targetPiece
				capturedPiece.Status = StatusHome
				capturedPiece.Position = freeHomeIndex
				state.Pieces[id] = capturedPiece
			}
		}
	}
}

func (state *GameState) MovePiece(pieceID string) {
	piece, ok := state.Pieces[pieceID]
	if !ok {
		return
	}

	if piece.Color != state.CurrentTurn {
		return
	}

	if state.DiceValue == nil {
		return
	}

	diceVal := *state.DiceValue
	moveCompleted := false

	if piece.Status == StatusHome {
		if diceVal == 6 {
			startPositions := map[PlayerColor]int{
				ColorRed:    0,
				ColorGreen:  14,
				ColorYellow: 26,
				ColorBlue:   40,
			}
			targetPosition := startPositions[piece.Color]

			piece.Status = StatusPath
			piece.Position = targetPosition
			state.Pieces[pieceID] = piece

			state.handleCollisions(targetPosition, StatusPath, piece)
			moveCompleted = true
		} else {
			return
		}
	}

	if piece.Status == StatusPath && !moveCompleted {
		rawNext := piece.Position + diceVal
		entryPos := HomeEntryPositions[piece.Color]

		isEnteringHomePath := (piece.Position <= entryPos && rawNext > entryPos) ||
			(piece.Position > entryPos && rawNext > 52+entryPos)

		if isEnteringHomePath {
			stepsIntoHomePath := rawNext - entryPos - 1
			if stepsIntoHomePath >= 5 {
				piece.Status = StatusFinished
				piece.Position = 0
			} else {
				piece.Status = StatusHomePath
				piece.Position = stepsIntoHomePath
			}
		} else {
			nextPosition := rawNext % 52
			piece.Position = nextPosition
			state.handleCollisions(nextPosition, StatusPath, piece)
		}

		state.Pieces[pieceID] = piece
		moveCompleted = true
	}

	if piece.Status == StatusHomePath && !moveCompleted {
		homePathLength := 5
		rawNext := piece.Position + diceVal

		if rawNext == homePathLength-1 {
			piece.Status = StatusFinished
			piece.Position = 0
		} else if rawNext > homePathLength-1 {
			overflow := rawNext - (homePathLength - 1)
			bouncedPosition := (homePathLength - 1) - overflow
			if bouncedPosition < 0 {
				bouncedPosition = 0
			}
			piece.Position = bouncedPosition
		} else {
			piece.Position = rawNext
		}
		
		state.Pieces[pieceID] = piece
		moveCompleted = true
	}

	if !moveCompleted && piece.Status == StatusFinished {
		return
	}

	// Update the dice value and turn
	if diceVal != 6 {
		state.CurrentTurn = GetNextTurn(state.CurrentTurn)
	}
	state.DiceValue = nil

	// Check win condition
	finishedCount := 0
	for _, p := range state.Pieces {
		if p.Color == piece.Color && p.Status == StatusFinished {
			finishedCount++
		}
	}

	if finishedCount == 4 {
		// Won
		newState := CreateInitialGameState(state.ID)
		newState.Status = "finished"
		
		state.Players = newState.Players
		state.Pieces = newState.Pieces
		state.CurrentTurn = newState.CurrentTurn
		state.DiceValue = newState.DiceValue
		state.Status = newState.Status
	}
}
