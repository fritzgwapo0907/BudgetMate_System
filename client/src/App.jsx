import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const App = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const navigate = useNavigate();
  const API_BASE = 'http://localhost:5000';

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post(`${API_BASE}/check-user`, {
      username,
      password,
    });

    const { id } = response.data;

    if (id) {
      localStorage.setItem('id', id); 
      setMessage('Login successful!');
      navigate('/dashboard');
    } else {
      setMessage('Login failed. Please try again.');
    }
  } catch (error) {
    setMessage(
      error.response?.status === 401
        ? 'Invalid username or password'
        : 'Login failed. Please try again later.'
    );
  }
};




  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/add-user`, {
        username,
        password,
        fname,
        lname,
      });

      setMessage('Account created successfully! You can now log in.');
      setIsSignUp(false);
      setUsername('');
      setPassword('');
      setFname('');
      setLname('');
    } catch (error) {
      setMessage(
        error.response?.status === 409
          ? 'Username already exists.'
          : 'Sign up failed. Please try again.'
      );
    }
  };

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setMessage('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 to-pink-400">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg backdrop-blur-md bg-opacity-40">
        <h1 className="text-3xl font-semibold text-center text-purple-800 mb-6">
          {isSignUp ? 'Sign Up to BudgetMate' : 'Login to BudgetMate'}
        </h1>

        <form
          onSubmit={isSignUp ? handleSignUp : handleLogin}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-4 text-purple-700 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-4 text-purple-700 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50"
          />

          {isSignUp && (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
                required
                className="w-full p-4 text-purple-700 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lname}
                onChange={(e) => setLname(e.target.value)}
                required
                className="w-full p-4 text-purple-700 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50"
              />
            </>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-center ${message.toLowerCase().includes('successful')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600'
              }`}
          >
            {message}
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={toggleForm}
            className="text-purple-600 hover:underline font-semibold"
          >
            {isSignUp
              ? 'Already have an account? Login here.'
              : "Don't have an account? Create one here."}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
