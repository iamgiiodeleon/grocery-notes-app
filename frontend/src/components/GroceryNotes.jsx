import React, { useState, useEffect, useRef } from 'react';

// Basic vector icons
const MicrophoneIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
);

const StopIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <rect x="6" y="6" width="12" height="12"/>
  </svg>
);

const UserIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const GroceryNotes = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [newNoteName, setNewNoteName] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [swipedItemId, setSwipedItemId] = useState(null);
  const [micPermission, setMicPermission] = useState('unknown');
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Load users and current user from localStorage
    try {
      const savedUsers = localStorage.getItem('groceryNotesUsers');
      const savedCurrentUser = localStorage.getItem('groceryNotesCurrentUser');
      
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        setUsers(parsedUsers);
        
        if (savedCurrentUser && parsedUsers.find(u => u.id === savedCurrentUser)) {
          setCurrentUser(savedCurrentUser);
        } else if (parsedUsers.length > 0) {
          setCurrentUser(parsedUsers[0].id);
        }
      } else {
        // Create default user if no users exist
        const defaultUser = {
          id: 'default',
          name: 'Default User',
          createdAt: new Date().toLocaleDateString()
        };
        setUsers([defaultUser]);
        setCurrentUser(defaultUser.id);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading users:", error);
      setHasError(true);
      setIsLoading(false);
    }
  }, []);

  // Load notes for current user
  useEffect(() => {
    if (currentUser) {
      try {
        const savedNotes = localStorage.getItem(`groceryNotes_${currentUser}`);
        if (savedNotes) {
          setNotes(JSON.parse(savedNotes));
        } else {
          setNotes([]);
        }
      } catch (error) {
        console.error("Error loading notes:", error);
        setNotes([]);
      }
    }
  }, [currentUser]);

  // Save notes for current user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`groceryNotes_${currentUser}`, JSON.stringify(notes));
    }
  }, [notes, currentUser]);

  // Save users
  useEffect(() => {
    localStorage.setItem('groceryNotesUsers', JSON.stringify(users));
  }, [users]);

  // Save current user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('groceryNotesCurrentUser', currentUser);
    }
  }, [currentUser]);

  // Click outside handler for user selector
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserSelector && !event.target.closest('.user-selector')) {
        setShowUserSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserSelector]);

  const createUser = () => {
    if (!newUserName.trim()) return;
    
    const newUser = {
      id: Date.now().toString(),
      name: newUserName.trim(),
      createdAt: new Date().toLocaleDateString()
    };
    
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser.id);
    setNewUserName('');
    setShowUserSelector(false);
  };

  const switchUser = (userId) => {
    setCurrentUser(userId);
    setCurrentNote(null); // Clear current note when switching users
    setShowUserSelector(false);
  };

  const deleteUser = (userId) => {
    if (users.length <= 1) return; // Don't delete the last user
    
    if (currentUser === userId) {
      const remainingUsers = users.filter(u => u.id !== userId);
      setCurrentUser(remainingUsers[0].id);
    }
    
    setUsers(prev => prev.filter(u => u.id !== userId));
    
    // Remove user's data from localStorage
    localStorage.removeItem(`groceryNotes_${userId}`);
  };

  // Initialize speech recognition
  useEffect(() => {
    const initializeSpeechRecognition = async () => {
      try {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = 'en-US';

          // Request microphone permission proactively
          try {
            if (navigator.permissions && navigator.permissions.query) {
              const permission = await navigator.permissions.query({ name: 'microphone' });
              if (permission.state === 'denied') {
                console.log('Microphone permission denied');
                setMicPermission('denied');
              } else if (permission.state === 'prompt') {
                console.log('Microphone permission will be requested on use');
                setMicPermission('prompt');
              } else if (permission.state === 'granted') {
                console.log('Microphone permission already granted');
                setMicPermission('granted');
              }
            } else {
              // Fallback for mobile devices that don't support Permissions API
              console.log('Permissions API not supported, will request on use');
              setMicPermission('prompt'); // Assume prompt if not supported
            }
          } catch (permError) {
            console.log('Permission API not supported, will request on use');
            setMicPermission('prompt'); // Assume prompt if not supported
          }

          recognitionRef.current.onresult = (event) => {
            const speechText = event.results[0][0].transcript.toLowerCase().trim();
            console.log("Speech recognized:", speechText);
            setTranscript(speechText);
            
            // Automatically parse and add the item when speech is recognized
            parseAndAddItem(speechText);
          };

          recognitionRef.current.onend = () => {
            setIsRecording(false);
          };

          recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
            
            // Handle specific permission errors
            if (event.error === 'not-allowed') {
              console.log('Microphone permission not granted');
              setMicPermission('denied');
            }
          };

          recognitionRef.current.onstart = () => {
            console.log('Speech recognition started');
            setMicPermission('granted'); // Update permission state when recording starts
          };
        } else {
          console.log("Speech recognition not supported in this browser");
        }
      } catch (error) {
        console.error("Error initializing speech recognition:", error);
      }
    };

    initializeSpeechRecognition();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const parseAndAddItem = (text) => {
    if (!currentNote && notes.length === 0) {
      return;
    }

    // If no current note is selected but we have notes, ask user to select one
    if (!currentNote && notes.length > 0) {
      return;
    }

    console.log("Parsing text:", text);
    
    // More flexible regex to catch different formats
    const regex = /^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:php|peso|pesos|piso)?$/i;
    const match = text.match(regex);
    
    if (match) {
      const itemName = match[1].trim();
      const price = parseFloat(match[2]);
      
      console.log("Parsed item:", itemName, "Price:", price);
      
      const newItem = {
        id: Date.now() + Math.random(),
        name: itemName,
        price: price,
        timestamp: new Date().toLocaleTimeString()
      };
      
      console.log("Adding new item:", newItem);
      
      // Update notes state using callback to ensure we have latest state
      setNotes(prevNotes => {
        const updatedNotes = prevNotes.map(note => 
          note.id === currentNote.id 
            ? { 
                ...note, 
                items: [...(note.items || []), newItem], 
                lastModified: new Date().toLocaleString() 
              }
            : note
        );
        
        console.log("Updated notes array:", updatedNotes);
        
        // Also update current note immediately
        const updatedCurrentNote = updatedNotes.find(note => note.id === currentNote.id);
        console.log("Updated current note:", updatedCurrentNote);
        setCurrentNote(updatedCurrentNote);
        
        return updatedNotes;
      });
      
      // Clear transcript after successful addition
      setTimeout(() => {
        setTranscript('');
      }, 1000);
      
    } else {
      console.log("Failed to parse:", text, "Regex match:", match);
    }
  };

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true);
      setTranscript(''); // Clear previous transcript
      
      try {
        recognitionRef.current.start();
        console.log('Starting speech recognition...');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsRecording(false);
        
        // If permission is denied, try to request it
        if (error.name === 'NotAllowedError') {
          console.log('Microphone permission denied, attempting to request...');
          // On mobile, this will trigger the permission request
          // The user will see the browser's permission dialog
        }
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const createNewNote = () => {
    if (!newNoteName.trim()) {
      return;
    }

    const newNote = {
      id: Date.now(),
      name: newNoteName.trim(),
      items: [],
      createdAt: new Date().toLocaleDateString(),
      lastModified: new Date().toLocaleString()
    };

    setNotes(prev => [newNote, ...prev]);
    setNewNoteName('');
  };

  const openNote = (note) => {
    setCurrentNote(note);
  };

  const deleteNote = (noteId) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (currentNote && currentNote.id === noteId) {
      setCurrentNote(null);
    }
  };

  const addManualItem = () => {
    if (!manualItemName.trim() || !manualItemPrice.trim()) {
      return;
    }

    const price = parseFloat(manualItemPrice);
    if (isNaN(price) || price <= 0) {
      return;
    }

    const newItem = {
      id: Date.now() + Math.random(),
      name: manualItemName.trim(),
      price: price,
      timestamp: new Date().toLocaleTimeString()
    };

    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => 
        note.id === currentNote.id 
          ? { 
              ...note, 
              items: [...(note.items || []), newItem], 
              lastModified: new Date().toLocaleString() 
            }
          : note
      );
      
      const updatedCurrentNote = updatedNotes.find(note => note.id === currentNote.id);
      setCurrentNote(updatedCurrentNote);
      
      return updatedNotes;
    });

    // Reset form
    setManualItemName('');
    setManualItemPrice('');
    setShowManualAdd(false);
  };

  const removeItem = (itemId) => {
    const updatedNotes = notes.map(note => 
      note.id === currentNote.id 
        ? { ...note, items: note.items.filter(item => item.id !== itemId), lastModified: new Date().toLocaleString() }
        : note
    );
    
    setNotes(updatedNotes);
    const updatedCurrentNote = updatedNotes.find(note => note.id === currentNote.id);
    setCurrentNote(updatedCurrentNote);
  };

  // Swipe handling for mobile
  const handleTouchStart = (e, itemId) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      const currentX = touch.clientX;
      const diffX = startX - currentX;
      
      if (Math.abs(diffX) > 50) {
        setSwipedItemId(itemId);
      }
    };
    
    const handleTouchEnd = () => {
      if (swipedItemId === itemId) {
        removeItem(itemId);
        setSwipedItemId(null);
      }
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const getTotalPrice = (items) => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Grocery Notes...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <p className="text-gray-600 mb-4">Something went wrong</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  // If no note is selected, show notes list
  if (!currentNote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header */}
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Grocery Notes
            </h1>
            <p className="text-gray-600 text-sm">Voice-powered shopping lists</p>
            
            {/* User Selector */}
            <div className="mt-4 user-selector">
              <button
                onClick={() => setShowUserSelector(!showUserSelector)}
                className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/20 hover:bg-white/90 transition-all duration-200"
              >
                <UserIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium">
                  {users.find(u => u.id === currentUser)?.name || 'Select User'}
                </span>
                <span className="text-gray-500">▼</span>
              </button>
              
              {showUserSelector && (
                <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 z-10 user-selector">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Switch User</h3>
                    
                    {/* Current Users */}
                    <div className="space-y-2 mb-4">
                      {users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="w-4 h-4 text-gray-500" />
                            <span className={`font-medium ${user.id === currentUser ? 'text-blue-600' : 'text-gray-700'}`}>
                              {user.name}
                            </span>
                            {user.id === currentUser && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Current</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            {user.id !== currentUser && (
                              <button
                                onClick={() => switchUser(user.id)}
                                className="text-blue-600 hover:text-blue-700 text-sm px-2 py-1 rounded hover:bg-blue-50"
                              >
                                Switch
                              </button>
                            )}
                            {users.length > 1 && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Create New User */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Add New User</h4>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="User name"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && createUser()}
                        />
                        <button
                          onClick={createUser}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Create New Note */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New List</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="e.g., Weekly Groceries"
                value={newNoteName}
                onChange={(e) => setNewNoteName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && createNewNote()}
              />
              <button 
                onClick={createNewNote}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Create List
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-lg border border-white/20">
                <p className="text-gray-500 text-lg">No grocery lists yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first list above</p>
              </div>
            ) : (
              notes.map((note, index) => (
                <div 
                  key={note.id} 
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden border border-white/20"
                >
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50/50 transition-all duration-200"
                    onClick={() => openNote(note)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-lg">{note.name}</h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center text-sm text-gray-500">
                            {note.items.length} items
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            {note.createdAt}
                          </div>
                        </div>
                        {note.items.length > 0 && (
                          <div className="mt-3">
                            <span className="text-xl font-bold text-green-600">
                              ₱{getTotalPrice(note.items).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 transition-all duration-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show selected note with items
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Back Button and Total Amount - Reduced padding top */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentNote(null)}
              className="rounded-full p-2 hover:bg-white/50 transition-all duration-200"
              title="Back to notes"
            >
              ← Back
            </button>
            <div className="text-center flex-1">
              <h1 className="text-xl font-semibold text-gray-900">{currentNote?.name}</h1>
              <p className="text-sm text-gray-500">
                {users.find(u => u.id === currentUser)?.name} • {currentNote?.items.length} items
              </p>
            </div>
            <div className="w-10" />
          </div>

          {/* Total Amount - Now at the very top */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 text-center shadow-lg border border-white/20 mb-4">
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <p className="text-4xl font-bold text-green-600">
              ₱{getTotalPrice(currentNote?.items || []).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Voice Recording */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
          <div className="text-center space-y-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full transition-all duration-300 transform hover:scale-110 ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 scale-110 shadow-2xl shadow-red-200' 
                  : micPermission === 'denied'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-2xl shadow-blue-200'
              }`}
              disabled={micPermission === 'denied'}
            >
              {isRecording ? <StopIcon className="w-8 h-8 text-white" /> : <MicrophoneIcon className="w-8 h-8 text-white" />}
            </button>
            
            <div>
              {isRecording ? (
                <div className="space-y-1">
                  <p className="text-red-600 font-medium text-lg">Listening...</p>
                  <p className="text-xs text-red-400">Tap again to stop</p>
                </div>
              ) : micPermission === 'denied' ? (
                <div className="space-y-1">
                  <p className="text-gray-500 font-medium text-lg">Microphone blocked</p>
                  <p className="text-xs text-gray-400">Enable in browser settings</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-gray-600">Tap to add item</p>
                </div>
              )}
            </div>

            {/* Add Item Button - Text changes based on transcript */}
            <button 
              onClick={() => transcript ? parseAndAddItem(transcript) : null}
              className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 ${
                transcript 
                  ? 'bg-green-500 hover:bg-green-600 text-white transform hover:scale-105 shadow-lg' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!transcript}
            >
              {transcript ? `Add "${transcript}"` : 'Say item name and price'}
            </button>

            {/* Permission Request Button */}
            {micPermission === 'denied' && (
              <button 
                onClick={() => {
                  // Try to start recording to trigger permission request
                  if (recognitionRef.current) {
                    try {
                      recognitionRef.current.start();
                      recognitionRef.current.stop();
                      setMicPermission('prompt');
                    } catch (error) {
                      console.log('Permission request failed:', error);
                    }
                  }
                }}
                className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
              >
                Request Microphone Permission
              </button>
            )}
          </div>
        </div>

        {/* Manual Add Item */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add Item Manually</h3>
            <button
              onClick={() => setShowManualAdd(!showManualAdd)}
              className="rounded-full p-2 hover:bg-gray-100 transition-all duration-200"
            >
              {showManualAdd ? '✕' : '+'}
            </button>
          </div>
          
          {showManualAdd && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Item name"
                value={manualItemName}
                onChange={(e) => setManualItemName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price (e.g., 85.50)"
                value={manualItemPrice}
                onChange={(e) => setManualItemPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
              />
              <button 
                onClick={addManualItem}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Add Item
              </button>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden border border-white/20">
          {!currentNote?.items?.length ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No items yet</p>
              <p className="text-gray-400 text-sm mt-1">Start recording or add manually</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100/50">
              {currentNote.items.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`p-4 flex items-center justify-between group transition-all duration-300 ${
                    swipedItemId === item.id ? 'bg-red-50 transform -translate-x-20' : ''
                  }`}
                  onTouchStart={(e) => handleTouchStart(e, item.id)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-blue-500 text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize text-lg">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-gray-900 text-lg">₱{item.price.toFixed(2)}</span>
                    {/* Swipe hint */}
                    <div className="text-xs text-gray-400 hidden sm:block">
                      ← Swipe to delete
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroceryNotes;