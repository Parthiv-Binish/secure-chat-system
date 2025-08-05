import { useEffect, useState } from 'react';
import axios from 'axios';

const Chat = ({ token, username }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket(`ws://localhost:8000/ws/${username}`);
    websocket.onopen = () => setWs(websocket);
    websocket.onmessage = () => fetchMessages();
    return () => websocket.close();
  }, [username]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/messages/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendMessage = () => {
    if (ws && newMessage && recipient) {
      ws.send(JSON.stringify({ content: newMessage, recipient }));
      setNewMessage('');
      fetchMessages();
    }
  };

  return (
    <div className="chat-container">
      <h2>Secure Chat</h2>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === username ? 'message-sent' : 'message-received'}`}>
            <span className="message-sender">{msg.sender}: </span>{msg.content}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Recipient username"
        className="chat-input"
      />
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message"
        className="chat-input"
      />
      <button onClick={sendMessage} className="chat-button">
        Send
      </button>
    </div>
  );
};

export default Chat;