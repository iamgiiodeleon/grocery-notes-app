import React, { useState, useEffect, useRef } from 'react';

const GroceryNotes = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [newNoteName, setNewNoteName] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Load notes from localStorage
    try {
      const savedNotes = localStorage.getItem('groceryNotes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading notes:", error);
      setHasError(true);
      setIsLoading(false);
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('groceryNotes', JSON.stringify(notes));
  }, [notes]);

  // Initialize speech recognition
  useEffect(() => {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const speechText = event.results[0][0].transcript.toLowerCase().trim();
          console.log("Speech recognized:", speechText);
          setTranscript(speechText);
          
          // Automatically parse and add the item when speech is recognized
          parseAndAddItem(speechText);
          
          // Show processing message
          alert(`Heard: "${speechText}"`);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          alert("Speech recognition failed. Please try again.");
        };
      } else {
        console.log("Speech recognition not supported in this browser");
        alert("Voice features not supported in this browser. You can still add items manually.");
      }
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      alert("Some features may not work properly. You can still add items manually.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const parseAndAddItem = (text) => {
    if (!currentNote && notes.length === 0) {
      alert('Please create a grocery list first or use the "Quick Add to New List" option below');
      return;
    }

    // If no current note is selected but we have notes, ask user to select one
    if (!currentNote && notes.length > 0) {
      alert('Please select a grocery list first, or use the "Quick Add to New List" option below');
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
      
      alert(`Added: ${itemName} - ₱${price.toFixed(2)}`);
      
      // Clear transcript after successful addition
      setTimeout(() => {
        setTranscript('');
      }, 1000);
      
    } else {
      console.log("Failed to parse:", text, "Regex match:", match);
      alert(`Heard: "${text}". Try "item name price" format.`);
    }
  };

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true);
      setTranscript(''); // Clear previous transcript
      recognitionRef.current.start();
      alert("Listening... Say item name and price (e.g., 'coke 100')");
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
      alert('Please enter a name for your grocery list');
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
    alert(`"${newNote.name}" grocery list created!`);
  };

  const openNote = (note) => {
    setCurrentNote(note);
  };

  const deleteNote = (noteId) => {
    if (confirm('Are you sure you want to delete this list?')) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (currentNote && currentNote.id === noteId) {
        setCurrentNote(null);
      }
    }
  };

  const addManualItem = () => {
    if (!manualItemName.trim() || !manualItemPrice.trim()) {
      alert('Please fill in both item name and price');
      return;
    }

    const price = parseFloat(manualItemPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
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
    alert(`Added: ${newItem.name} - ₱${newItem.price.toFixed(2)}`);
  };

  const removeItem = (itemId) => {
    if (confirm('Remove this item?')) {
      const updatedNotes = notes.map(note => 
        note.id === currentNote.id 
          ? { ...note, items: note.items.filter(item => item.id !== itemId), lastModified: new Date().toLocaleString() }
          : note
      );
      
      setNotes(updatedNotes);
      const updatedCurrentNote = updatedNotes.find(note => note.id === currentNote.id);
      setCurrentNote(updatedCurrentNote);
    }
  };

  const getTotalPrice = (items) => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  const quickAddToNewList = () => {
    if (!transcript.trim()) {
      alert('Please say an item name and price first.');
      return;
    }
    if (!newNoteName.trim()) {
      alert('Please enter a name for your new list.');
      return;
    }

    // Parse the transcript to extract item name and price
    const regex = /^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:php|peso|pesos|piso)?$/i;
    const match = transcript.match(regex);
    
    if (!match) {
      alert(`Could not parse "${transcript}". Please use format "item name price"`);
      return;
    }

    const itemName = match[1].trim();
    const price = parseFloat(match[2]);

    const newNote = {
      id: Date.now(),
      name: newNoteName.trim(),
      items: [],
      createdAt: new Date().toLocaleDateString(),
      lastModified: new Date().toLocaleString()
    };

    // Add the parsed item to the new note
    newNote.items.push({
      id: Date.now() + Math.random(),
      name: itemName,
      price: price,
      timestamp: new Date().toLocaleTimeString()
    });

    setNotes(prev => [newNote, ...prev]);
    setNewNoteName('');
    alert(`"${newNote.name}" grocery list created with "${itemName} - ₱${price.toFixed(2)}"!`);
    setTranscript(''); // Clear transcript after quick add
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
          </div>

          {/* Voice Recording - Available from main view */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
            <div className="text-center space-y-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full transition-all duration-300 transform hover:scale-110 ${
                  isRecording 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 scale-110 shadow-2xl shadow-red-200' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-2xl shadow-blue-200'
                }`}
              >
                {isRecording ? '⏹️' : '🎤'}
              </button>
              
              <div>
                {isRecording ? (
                  <div className="space-y-1">
                    <p className="text-red-600 font-medium text-lg">🎤 Listening...</p>
                    <p className="text-xs text-red-400">Tap again to stop</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-gray-600">Tap to record items</p>
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

              {/* Quick Add to New List */}
              {transcript && (
                <div className="bg-blue-50/80 rounded-xl p-3 border border-blue-200">
                  <p className="text-xs text-blue-600 mb-2">Quick Add to New List:</p>
                  <input
                    type="text"
                    placeholder="List name (optional)"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && quickAddToNewList()}
                  />
                  <button 
                    onClick={quickAddToNewList}
                    className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-lg transition-colors"
                  >
                    Create List & Add Item
                  </button>
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
                <p className="text-gray-400 text-sm mt-1">Create your first list above or use voice recording</p>
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
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <button
            onClick={() => setCurrentNote(null)}
            className="rounded-full p-2 hover:bg-white/50 transition-all duration-200"
            title="Back to notes"
          >
            ← Back
          </button>
          <div className="text-center flex-1">
            <h1 className="text-xl font-semibold text-gray-900">{currentNote?.name}</h1>
            <p className="text-sm text-gray-500">{currentNote?.items.length} items</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Total Amount */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 text-center shadow-lg border border-white/20">
          <p className="text-sm text-gray-500 mb-1">Total Amount</p>
          <p className="text-4xl font-bold text-green-600">
            ₱{getTotalPrice(currentNote?.items || []).toFixed(2)}
          </p>
        </div>

        {/* Voice Recording */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
          <div className="text-center space-y-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full transition-all duration-300 transform hover:scale-110 ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 scale-110 shadow-2xl shadow-red-200' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-2xl shadow-blue-200'
              }`}
            >
              {isRecording ? '⏹️' : '🎤'}
            </button>
            
            <div>
              {isRecording ? (
                <div className="space-y-1">
                  <p className="text-red-600 font-medium text-lg">🎤 Listening...</p>
                  <p className="text-xs text-red-400">Tap again to stop</p>
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
                  className="p-4 flex items-center justify-between group transition-all duration-300"
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
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 transition-all duration-200"
                    >
                      🗑️
                    </button>
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