import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Mic, MicOff, Plus, ArrowLeft, Trash2, ShoppingCart, FileText, Calendar } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const SwipeableRow = ({ children, onRemove, deleteThreshold = 80 }) => {
  const startXRef = React.useRef(0);
  const startYRef = React.useRef(0);
  const [translateX, setTranslateX] = React.useState(0);
  const [swiping, setSwiping] = React.useState(false);
  const [beingDeleted, setBeingDeleted] = React.useState(false);

  const handleTouchStart = (e) => {
    if (beingDeleted) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!swiping || beingDeleted) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;
    if (Math.abs(deltaX) < Math.abs(deltaY)) return;
    setTranslateX(Math.max(-120, Math.min(120, deltaX)));
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    if (beingDeleted) return;
    if (Math.abs(translateX) > deleteThreshold) {
      setBeingDeleted(true);
      const finalX = translateX < 0 ? -window.innerWidth : window.innerWidth;
      setTranslateX(finalX);
      setTimeout(() => {
        onRemove && onRemove();
      }, 180);
    } else {
      setTranslateX(0);
    }
  };

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${translateX}px)`,
        opacity: 1 - Math.min(0.4, Math.abs(translateX) / 300),
        transition: swiping ? 'none' : 'transform 200ms ease, opacity 200ms ease'
      }}
    >
      {children}
    </div>
  );
};

const GroceryNotes = () => {
  const [currentView, setCurrentView] = useState('notes'); // 'notes' or 'recording'
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [newNoteName, setNewNoteName] = useState('');
  const recognitionRef = useRef(null);
  const { toast } = useToast();
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('groceryNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('groceryNotes', JSON.stringify(notes));
  }, [notes]);

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

        // Pre-fill manual inputs by splitting text and number
        const m = speechText.match(/^(.+?)\s+(\d+(?:\.\d+)?)/i);
        if (m) {
          setManualItemName(m[1].trim());
          setManualItemPrice(m[2]);
        }

        toast({
          title: "Voice captured",
          description: `Heard: "${speechText}"`,
        });
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast({
          title: "Error",
          description: "Speech recognition failed. Please try again.",
          variant: "destructive"
        });
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const parseAndAddItem = (text) => {
    if (!currentNote) {
      console.log("No current note selected");
      toast({
        title: "Error",
        description: "No grocery list selected",
        variant: "destructive"
      });
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
      
      toast({
        title: "Added ✅",
        description: `${itemName} - ₱${price.toFixed(2)}`,
      });
      
      // Clear transcript after successful addition
      setTranscript('');
      
    } else {
      console.log("Failed to parse:", text, "Regex match:", match);
      toast({
        title: "Not Recognized",
        description: `Heard: "${text}". Try "item name price" format.`,
        variant: "destructive"
      });
    }
  };

  const handleManualNameChange = (e) => {
    const value = e.target.value;
    const m = value.match(/^(.+?)\s+(\d+(?:\.\d+)?)/);
    if (m) {
      setManualItemName(m[1].trim());
      setManualItemPrice(m[2]);
    } else {
      setManualItemName(value);
    }
  };

  const addManualItem = () => {
    if (!currentNote) {
      toast({
        title: "Error",
        description: "No grocery list selected",
        variant: "destructive"
      });
      return;
    }

    let name = manualItemName.trim();
    let priceValue = parseFloat(manualItemPrice);

    if ((!name || isNaN(priceValue)) && manualItemName) {
      const m = manualItemName.match(/^(.+?)\s+(\d+(?:\.\d+)?)/i);
      if (m) {
        if (!name) name = m[1].trim();
        if (isNaN(priceValue)) priceValue = parseFloat(m[2]);
      }
    }

    if (!name) {
      toast({ title: "Error", description: "Item name is required", variant: "destructive" });
      return;
    }

    if (isNaN(priceValue)) {
      priceValue = 0;
    }

    const newItem = {
      id: Date.now() + Math.random(),
      name,
      price: priceValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => 
        note.id === currentNote.id 
          ? { ...note, items: [...(note.items || []), newItem], lastModified: new Date().toLocaleString() }
          : note
      );
      const updatedCurrentNote = updatedNotes.find(note => note.id === currentNote.id);
      setCurrentNote(updatedCurrentNote);
      return updatedNotes;
    });

    toast({ title: "Added ✅", description: `${name} - ₱${priceValue.toFixed(2)}` });

    setManualItemName('');
    setManualItemPrice('');
  };

  const createNewNote = () => {
    if (!newNoteName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your grocery list",
        variant: "destructive"
      });
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
    toast({
      title: "Created",
      description: `"${newNote.name}" grocery list created`,
    });
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
    toast({
      title: "Deleted",
      description: "Grocery list has been deleted",
    });
  };

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true);
      setTranscript(''); // Clear previous transcript
      recognitionRef.current.start();
      toast({
        title: "Listening...",
        description: "Say item name and price (e.g., 'coke 100')",
      });
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
    
    toast({
      title: "Removed",
      description: "Item deleted from list",
    });
  };

  const getTotalPrice = (items) => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  if (currentView === 'notes') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header */}
          <div className="text-center py-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Grocery Notes</h1>
            <p className="text-gray-600 text-sm">Voice-powered shopping lists</p>
          </div>

          {/* Create New Note */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">New List</h3>
            <div className="space-y-3">
              <Input
                placeholder="e.g., Weekly Groceries"
                value={newNoteName}
                onChange={(e) => setNewNoteName(e.target.value)}
                className="rounded-xl border-gray-200 bg-gray-50"
                onKeyPress={(e) => e.key === 'Enter' && createNewNote()}
              />
              <Button 
                onClick={createNewNote}
                className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 h-12"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create List
              </Button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No grocery lists yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first list above</p>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div 
                    className="p-6 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => openNote(note)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{note.name}</h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            {note.items.length} items
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        className="text-red-500 hover:text-red-700 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

  // Recording View
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('notes')}
            className="rounded-full p-2"
            title="Back to notes"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{currentNote?.name}</h1>
            <p className="text-sm text-gray-500">{currentNote?.items.length} items</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Total Amount */}
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Amount</p>
          <p className="text-3xl font-bold text-gray-900">
            ₱{getTotalPrice(currentNote?.items || []).toFixed(2)}
          </p>
        </div>

        {/* Voice Recording */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-center space-y-4">
            <Button
              size="lg"
              className={`w-20 h-20 rounded-full transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-200' 
                  : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-200'
              }`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
            
            {isRecording ? (
              <div className="space-y-1">
                <p className="text-red-600 font-medium">🎤 Listening...</p>
                <p className="text-xs text-red-400">Tap again to stop</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-gray-600">Tap to add item</p>
                <p className="text-xs text-gray-400">Say "item name price"</p>
              </div>
            )}
          </div>

          {transcript && (
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">You said:</p>
              <p className="text-sm font-medium text-blue-800">"{transcript}"</p>
              <Button
                onClick={() => parseAndAddItem(transcript)}
                className="mt-2"
                disabled={!currentNote}
              >
                {transcript.charAt(0).toUpperCase() + transcript.slice(1)}
              </Button>
            </div>
          )}

          </div>

          {/* Manual Add Item */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add Manually</h3>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Input
                placeholder="Item name"
                value={manualItemName}
                onChange={handleManualNameChange}
                className="flex-1 rounded-xl border-gray-200 bg-gray-50"
                onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
              />
              <Input
                type="number"
                placeholder="Price"
                value={manualItemPrice}
                onChange={(e) => setManualItemPrice(e.target.value)}
                className="w-full sm:w-24 rounded-xl border-gray-200 bg-gray-50"
                onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
              />
              <Button
                onClick={addManualItem}
                className="w-full sm:w-auto rounded-xl bg-green-500 hover:bg-green-600"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add</span>
              </Button>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {!currentNote?.items?.length ? (
              <div className="p-8 text-center">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No items yet</p>
                <p className="text-gray-400 text-sm mt-1">Start recording to add items</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {currentNote.items.map((item, index) => (
                  <SwipeableRow key={item.id} onRemove={() => removeItem(item.id)}>
                    <div className="p-4 flex items-center justify-between group">
                      <div className="flex items-center space-x-3 flex-1">
                        <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 capitalize">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900">₱{item.price.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8 p-0 flex items-center justify-center"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </SwipeableRow>
                ))}
              </div>
            )}
          </div>

          {/* Debug Info - Remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 rounded-2xl p-4 text-xs space-y-1">
              <p><strong>Debug Info:</strong></p>
              <p>Current Note ID: {currentNote?.id}</p>
              <p>Items Count: {currentNote?.items?.length || 0}</p>
              <p>Last Transcript: "{transcript}"</p>
              <p>Total Notes: {notes.length}</p>
              <p>Recording: {isRecording ? 'YES' : 'NO'}</p>
              {currentNote?.items?.length > 0 && (
                <div>
                  <p><strong>Items:</strong></p>
                  {currentNote.items.map((item, idx) => (
                    <p key={item.id}>• {item.name} - ₱{item.price}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

export default GroceryNotes;