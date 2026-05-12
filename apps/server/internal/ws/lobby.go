package ws

type Lobby struct {
	hubs map[string]*Hub
}

func NewLobby() *Lobby {
	return &Lobby{
		hubs: make(map[string]*Hub),
	}
}

func (l *Lobby) AddHub(id string, hub *Hub) {
	l.hubs[id] = hub
}

func (l *Lobby) GetHub(id string) *Hub {
	return l.hubs[id]
}

func (l *Lobby) RemoveHub(id string) {
	delete(l.hubs, id)
}
