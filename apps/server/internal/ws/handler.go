package ws

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all origins for dev simplicity
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func ServeWs(hubManager *HubManager, w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("sessionId")
	hubID := r.URL.Query().Get("hubId")

	hub, ok := hubManager.hubs[hubID]

	if !ok {
		log.Println("hub not found:", hubID)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade err:", err)
		return
	}

	client := &Client{
		Hub:       hub,
		Conn:      conn,
		SessionID: sessionID,
		HubID:     hubID,
		Send:      make(chan []byte, 256),
	}

	client.Hub.Register <- client

	// Allow collection of memory referenced .by the caller by doing all work in
	// new goroutines.
	go client.WritePump()
	go client.ReadPump()
}
