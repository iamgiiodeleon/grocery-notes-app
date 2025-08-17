import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Plus, ArrowLeft, Trash2, ShoppingCart, FileText, Calendar } from 'lucide-react';

const GroceryNotes = () => {
  const [currentView, setCurrentView] = useState('notes'); // 'notes' or 'recording'
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [newNoteName, setNewNoteName] = useState('');
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [toasts, setToasts] = useState([]);
  const recognitionRef = useRef(null);

  // Toast system
  const showToast = (title, description, variant = 'default') => {
    const id = Date.now();
    const toast = { id, title, description, variant };
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Load notes from memory (localStorage not supported)
  useEffect(() => {
    // Initialize with empty array since localStorage is not supported
    setNotes([]);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
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
        
        showToast("Voice Captured", `Heard: "${speechText}"`);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        showToast("Error", "Speech recognition failed. Please try again.", "destructive");
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const parseAndAddItem = (text) => {
    if (!currentNote) {
      console.log("No current note selected");
      showToast("Error", "No grocery list selected", "destructive");
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
        id: Date.now() + Math.random(), // Ensure unique ID
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
      
      showToast("Added ✅", `${itemName} - ₱${price.toFixed(2)}`);
      
      // Clear transcript after successful addition
      setTranscript('');
      
    } else {
      console.log("Failed to parse:", text, "Regex match:", match);
      showToast("Not Recognized", `Heard: "${text}". Try "item name price" format.`, "destructive");
    }
  };

  const addManualItem = () => {
    if (!currentNote) {
      showToast("Error", "No grocery list selected", "destructive");
      return;
    }

    if (!manualItemName.trim()) {
      showToast("Error", "Item name is required", "destructive");
      return;
    }

    const price = parseFloat(manualItemPrice) || 0;
    
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

    showToast("Added ✅", `${newItem.name} - ₱${price.toFixed(2)}`);

    // Clear manual inputs
    setManualItemName('');
    setManualItemPrice('');
  };

  const createNewNote = () => {
    if (!newNoteName.trim()) {
      showToast("Name Required", "Please enter a name for your grocery list", "destructive");
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
    showToast("Created", `"${newNote.name}" grocery list created`);
  };

  const openNote = (note) => {
    console.log("Opening note:", note);
    // Ensure we get the latest version of the note from the notes array
    const latestNote = notes.find(n => n.id === note.id) || note;
    setCurrentNote(latestNote);
    setCurrentView('recording');
  };

  const deleteNote = (noteId) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (currentNote && currentNote.id === noteId) {
      setCurrentNote(null);
      setCurrentView('notes');
    }
    showToast("Deleted", "Grocery list has been deleted");
  };

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true);
      setTranscript(''); // Clear previous transcript
      recognitionRef.current.start();
      showToast("Listening...", "Say item name and price (e.g., 'coke 100')");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeItem = (itemId) => {
    const updatedNotes = notes.map(note => 
      note.id === currentNote.id 
        ? { ...note, items: note.items.filter(item => item.id !== itemId), lastModified: new Date().toLocaleString() }
        : note
    );
    
    setNotes(updatedNotes);

    // Update current note to match
    const updatedCurrentNote = updatedNotes.find(note => note.id === currentNote.id);
    setCurrentNote(updatedCurrentNote);
    
    showToast("Removed", "Item deleted from list");
  };

  const getTotalPrice = (items) => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  if (currentView === 'notes') {
    return (
      <div className="min-h-screen bg-gray-50 p-2 sm:p-4 relative">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header */}
          <div className="text-center py-4 sm:py-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Grocery Notes</h1>
            <p className="text-gray-600 text-sm">Voice-powered shopping lists</p>
          </div>

          {/* Create New Note */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">New List</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="e.g., Weekly Groceries"
                value={newNoteName}
                onChange={(e) => setNewNoteName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && createNewNote()}
              />
              <button 
                onClick={createNewNote}
                className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium flex items-center justify-center transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create List
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-sm">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No grocery lists yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first list above</p>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div 
                    className="p-4 sm:p-6 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => openNote(note)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{note.name}</h3>
                        <div className="flex items-center space-x-2 sm:space-x-4 mt-2">
                          <div className="flex items-center text-xs sm:text-sm text-gray-500">
                            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {note.items.length} items
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-500">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {note.createdAt}
                          </div>
                        </div>
                        {note.items.length > 0 && (
                          <div className="mt-3">
                            <span className="text-lg font-semibold text-green-600">
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
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Toast Container */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-lg border max-w-sm animate-pulse ${
                toast.variant === 'destructive'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            >
              <div className="font-medium text-sm">{toast.title}</div>
              {toast.description && (
                <div className="text-xs mt-1 opacity-80">{toast.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Recording View
  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 relative">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <button
            onClick={() => setCurrentView('notes')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Back to notes"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{currentNote?.name}</h1>
            <p className="text-sm text-gray-500">{currentNote?.items.length} items</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Total Amount */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Amount</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            ₱{getTotalPrice(currentNote?.items || []).toFixed(2)}
          </p>
        </div>

        {/* Voice Recording */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="text-center space-y-4">
            <button
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full transition-all duration-200 flex items-center justify-center ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-200' 
                  : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-200'
              }`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <MicOff className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              ) : (
                <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              )}
            </button>
            
            <div>
              {isRecording ? (
                <div className="space-y-1">
                  <p className="text-red-600 font-medium">🎤 Listening...</p>
                  <p className="text-xs text-red-400">Tap again to stop</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-gray-600">Tap to record</p>
                  <p className="text-xs text-gray-400">Say "item name price"</p>
                </div>
              )}
            </div>

            {transcript && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-600 mb-1">You said:</p>
                <p className="text-sm font-medium text-blue-800">"{transcript}"</p>
                <button
                  onClick={() => parseAndAddItem(transcript)}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 border-blue-500 rounded-lg text-sm font-medium transition-colors"
                >
                  {transcript.charAt(0).toUpperCase() + transcript.slice(1)}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Manual Add Item */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Add Manually</h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              placeholder="Item name"
              value={manualItemName}
              onChange={(e) => setManualItemName(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
            />
            <input
              type="number"
              placeholder="Price"
              value={manualItemPrice}
              onChange={(e) => setManualItemPrice(e.target.value)}
              className="w-full sm:w-24 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
            />
            <button
              onClick={addManualItem}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium flex items-center justify-center transition-colors"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {!currentNote?.items?.length ? (
            <div className="p-6 sm:p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No items yet</p>
              <p className="text-gray-400 text-sm mt-1">Start recording or add manually</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {currentNote.items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="relative group"
                >
                  <div className="p-3 sm:p-4 flex items-center justify-between transition-all duration-200 hover:bg-gray-50">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 capitalize truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">₱{item.price.toFixed(2)}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 p-0 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full opacity-70 hover:opacity-100 transition-all duration-200"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg border max-w-sm animate-pulse ${
              toast.variant === 'destructive'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="font-medium text-sm">{toast.title}</div>
            {toast.description && (
              <div className="text-xs mt-1 opacity-80">{toast.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroceryNotes;