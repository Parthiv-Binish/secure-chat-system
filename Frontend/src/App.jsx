import { useState } from 'react';
import Chat from './components/Chat.jsx';
import FaceAuth from './components/FaceAuth.jsx';

const App = () => {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');

  const handleLogin = (token, username) => {
    setToken(token);
    setUsername(username);
  };

  return (
    <div className="app-container">
      {token ? <Chat token={token} username={username} /> : <FaceAuth onLogin={handleLogin} />}
    </div>
  );
};

export default App;