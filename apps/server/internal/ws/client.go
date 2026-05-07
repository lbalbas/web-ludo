package ws

import (
	"log"

	"github.com/gorilla/websocket"
)

type Event struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type Client struct {
	Hub       *Hub
	Conn      *websocket.Conn
	Send      chan []byte
	Color     string // Player color (e.g., "red", "green")
	PlayerID  string
	SessionID string
	IsLeaving bool
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// Send message to hub for routing
		c.Hub.Incoming <- &ClientMessage{
			Client:  c,
			Message: message,
		}
	}
}

func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for message := range c.Send {
		w, err := c.Conn.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		w.Write(message)

		if err := w.Close(); err != nil {
			return
		}
	}

	// The hub closed the channel.
	c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
}
