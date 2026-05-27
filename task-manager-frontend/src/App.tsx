import { Routes, Route } from 'react-router-dom';
import { TaskList } from './pages/TaskList';
import { TaskDetail } from './pages/TaskDetail';
import { Login } from './pages/Login';
import { Loginv2 } from './pages/Loginv2';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/login-v2" element={<Loginv2 />} />
      <Route path="/" element={<TaskList />} />
      <Route path="/task/:id" element={<TaskDetail />} />
    </Routes>
  );
}

export default App;