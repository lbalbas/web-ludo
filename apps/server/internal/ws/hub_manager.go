package ws

type HubManager struct {
	hubs map[string]*Hub
}

func NewHubManager() *HubManager {
	return &HubManager{
		hubs: make(map[string]*Hub),
	}
}

func (l *HubManager) CreateHub(id string) {
	hub := NewHub()
	go hub.Run()
	l.hubs[id] = hub
}

func (l *HubManager) GetHub(id string) *Hub {
	return l.hubs[id]
}

func (l *HubManager) RemoveHub(id string) {
	delete(l.hubs, id)
}
