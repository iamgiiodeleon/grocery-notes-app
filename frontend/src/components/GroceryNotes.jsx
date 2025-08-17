import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Mic, MicOff, Plus, ArrowLeft, Trash2, ShoppingCart, FileText, Calendar, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const GroceryNotes = () => {
  const [currentView, setCurrentView] = useState('notes'); // 'notes' or 'recording'
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [newNoteName, setNewNoteName] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [swipedItemId, setSwipedItemId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const recognitionRef = useRef(null);
  const { toast } = useToast();

  // Load notes from localStorage on component mount
  useEffect(() => {
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
      toast({
        title: "Error Loading Data",
        description: "Could not load saved notes. Starting fresh.",
        variant: "destructive"
      });
    }
  }, [toast]);

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
          toast({
            title: "Processing...",
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
      } else {
        console.log("Speech recognition not supported in this browser");
        // Show a toast to inform user
        toast({
          title: "Speech Recognition Unavailable",
          description: "Voice features not supported in this browser. You can still add items manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      toast({
        title: "Initialization Error",
        description: "Some features may not work properly. You can still add items manually.",
        variant: "destructive"
      });
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
      
      // Force a re-render and keep transcript visible for manual button use
      setTimeout(() => {
        // Don't clear transcript immediately so user can see it and use test button
        // setTranscript('');
      }, 2000);
      
    } else {
      console.log("Failed to parse:", text, "Regex match:", match);
      toast({
        title: "Not Recognized",
        description: `Heard: "${text}". Try "item name price" format.`,
        variant: "destructive"
      });
    }
  };

  const addManualItem = () => {
    if (!manualItemName.trim() || !manualItemPrice.trim()) {
      toast({
        title: "Fields Required",
        description: "Please fill in both item name and price",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(manualItemPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price",
        variant: "destructive"
      });
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

    toast({
      title: "Added ✅",
      description: `${newItem.name} - ₱${newItem.price.toFixed(2)}`,
    });
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center animate-fade-in">
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
        <div className="text-center animate-fade-in">
          <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <p className="text-gray-600 mb-4">Something went wrong</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600"
          >
            Reload App
          </Button>
        </div>
      </div>
    );
  }

  if (currentView === 'notes') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header */}
          <div className="text-center py-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Grocery Notes
            </h1>
            <p className="text-gray-600 text-sm">Voice-powered shopping lists</p>
          </div>

          {/* Create New Note */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20 animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New List</h3>
            <div className="space-y-3">
              <Input
                placeholder="e.g., Weekly Groceries"
                value={newNoteName}
                onChange={(e) => setNewNoteName(e.target.value)}
                className="rounded-xl border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && createNewNote()}
              />
              <Button 
                onClick={createNewNote}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-12 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create List
              </Button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-lg border border-white/20 animate-fade-in">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-bounce" />
                <p className="text-gray-500 text-lg">No grocery lists yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first list above</p>
              </div>
            ) : (
              notes.map((note, index) => (
                <div 
                  key={note.id} 
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden border border-white/20 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div 
                    className="p-6 cursor-pointer active:bg-gray-50/50 transition-all duration-200 hover:bg-white/90"
                    onClick={() => openNote(note)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-lg">{note.name}</h3>
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
                            <span className="text-xl font-bold text-green-600">
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
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4 animate-slide-down">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('notes')}
            className="rounded-full p-2 hover:bg-white/50 transition-all duration-200"
            title="Back to notes"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-xl font-semibold text-gray-900">{currentNote?.name}</h1>
            <p className="text-sm text-gray-500">{currentNote?.items.length} items</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Total Amount */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 text-center shadow-lg border border-white/20 animate-slide-up">
          <p className="text-sm text-gray-500 mb-1">Total Amount</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            ₱{getTotalPrice(currentNote?.items || []).toFixed(2)}
          </p>
        </div>

        {/* Manual Add Item */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add Item</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowManualAdd(!showManualAdd)}
              className="rounded-full p-2 hover:bg-gray-100 transition-all duration-200"
            >
              {showManualAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          
          {showManualAdd && (
            <div className="space-y-3 animate-expand">
              <Input
                placeholder="Item name"
                value={manualItemName}
                onChange={(e) => setManualItemName(e.target.value)}
                className="rounded-xl border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
              />
              <Input
                placeholder="Price (e.g., 85.50)"
                value={manualItemPrice}
                onChange={(e) => setManualItemPrice(e.target.value)}
                className="rounded-xl border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
              />
              <Button 
                onClick={addManualItem}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-12 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Item
              </Button>
            </div>
          )}
        </div>

        {/* Voice Recording */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20 animate-slide-up">
          <div className="text-center space-y-4">
            <Button
              size="lg"
              className={`w-20 h-20 rounded-full transition-all duration-300 transform hover:scale-110 ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 scale-110 shadow-2xl shadow-red-200' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-2xl shadow-blue-200'
              }`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <MicOff className="h-8 w-8 animate-pulse" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
            
            <div>
              {isRecording ? (
                <div className="space-y-1 animate-fade-in">
                  <p className="text-red-600 font-medium text-lg">🎤 Listening...</p>
                  <p className="text-xs text-red-400">Tap again to stop</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-gray-600">Tap to add item</p>
                </div>
              )}
            </div>

            {transcript && (
              <div className="bg-blue-50/80 backdrop-blur-sm p-3 rounded-xl border border-blue-200 animate-fade-in">
                <p className="text-xs text-blue-600 mb-1">You said:</p>
                <p className="text-sm font-medium text-blue-800">"{transcript}"</p>
                <p className="text-xs text-blue-500 mt-1">Click test button to add this item</p>
              </div>
            )}

            {/* Test button for debugging */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => parseAndAddItem(transcript || 'milk 85')}
                className="mt-2 transition-all duration-200 hover:bg-blue-50"
                disabled={!transcript && !currentNote}
              >
                {transcript ? `Add "${transcript}"` : 'Test Add "milk 85"'}
              </Button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden border border-white/20 animate-slide-up">
          {!currentNote?.items?.length ? (
            <div className="p-8 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-bounce" />
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
                    <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                      {index + 1}
                    </Badge>
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

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50/80 backdrop-blur-sm rounded-3xl p-4 text-xs space-y-1 animate-fade-in">
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