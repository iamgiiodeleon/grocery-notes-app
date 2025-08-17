import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Mic, MicOff, Plus, ArrowLeft, Trash2, ShoppingCart, FileText, Calendar } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const GroceryNotes = () => {
  const [currentView, setCurrentView] = useState('notes'); // 'notes' or 'recording'
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [newNoteName, setNewNoteName] = useState('');
  const recognitionRef = useRef(null);
  const { toast } = useToast();

  // --- NEW (manual quick add state)
  const [manualEntry, setManualEntry] = useState('');
  const [manualParsed, setManualParsed] = useState({ name: '', price: 0 });

  // --- NEW (swipe-to-delete helpers)
  const touchStartXRef = useRef({});
  const [deletingId, setDeletingId] = useState(null);
  const SWIPE_THRESHOLD = 60; // px

  // ===== Helpers =====
  // Format "sugar 100" -> "Sugar 100"
  const toTitleCase = (s = '') =>
    s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  // Parse any "<words> <number>" style in any order; picks the LAST number in the string as price
  const parseSpokenItem = (rawText) => {
    if (!rawText) return null;
    const text = rawText
      .toLowerCase()
      .replace(/\b(php|peso|pesos|piso)\b\.?/gi, '')
      .trim();

    // find all numeric tokens
    const nums = [...text.matchAll(/(\d+(?:\.\d+)?)/g)];
    if (nums.length === 0) {
      return { name: text.trim(), price: 0 }; // fallback: no number spoken/typed
    }
    const last = nums[nums.length - 1];
    const price = parseFloat(last[1]);

    // remove that number once from the string to get the name
    const name = (text.slice(0, last.index) + text.slice(last.index + last[0].length))
      .replace(/\s+/g, ' ')
      .trim();

    return { name: name || 'item', price: isNaN(price) ? 0 : price };
  };

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
        // Mirror transcript into manual entry so user can tweak before adding
        setTranscript(speechText);
        setManualEntry(speechText);
        const parsed = parseSpokenItem(speechText);
        if (parsed) setManualParsed(parsed);

        toast({ title: "Heard", description: `"${speechText}"` });
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
      toast({
        title: "Error",
        description: "No grocery list selected",
        variant: "destructive"
      });
      return;
    }

    const parsed = parseSpokenItem(text);
    if (!parsed) {
      toast({
        title: "Not Recognized",
        description: `Heard: "${text}". Try "item name price" format.`,
        variant: "destructive"
      });
      return;
    }

    const { name: itemName, price } = parsed;

    const newItem = {
      id: Date.now() + Math.random(), // Ensure unique ID
      name: itemName,
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
      // Keep currentNote in sync
      const updatedCurrentNote = updatedNotes.find(note => note.id === currentNote.id);
      setCurrentNote(updatedCurrentNote);
      return updatedNotes;
    });

    toast({
      title: "Added ✅",
      description: `${toTitleCase(itemName)} - ₱${Number(price || 0).toFixed(2)}`,
    });
  };

  // --- NEW: add from manual quick entry
  const addManualItem = () => {
    if (!manualEntry.trim()) return;
    parseAndAddItem(manualEntry.trim());
    setManualEntry('');
    setManualParsed({ name: '', price: 0 });
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
      setTranscript('');     // clear previous transcript
      setManualEntry('');    // clear manual
      setManualParsed({ name: '', price: 0 });
      recognitionRef.current.start();
      toast({
        title: "Listening...",
        description: "Say item name price (e.g., 'coke 100')",
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
    const updatedCurrentNote = updatedNotes.find(note => note.id === currentNote.id);
    setCurrentNote(updatedCurrentNote);
    toast({ title: "Removed", description: "Item deleted from list" });
  };

  // --- NEW: lightweight swipe-to-delete (no extra libs)
  const onTouchStart = (id) => (e) => {
    touchStartXRef.current[id] = e.touches?.[0]?.clientX ?? 0;
  };
  const onTouchEnd = (id) => (e) => {
    const startX = touchStartXRef.current[id] ?? 0;
    const endX = e.changedTouches?.[0]?.clientX ?? startX;
    const dx = endX - startX;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      // Subtle slide/fade before removal
      setDeletingId(id);
      setTimeout(() => {
        removeItem(id);
        setDeletingId(null);
        delete touchStartXRef.current[id];
      }, 180);
    }
  };

  const getTotalPrice = (items) => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
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
                onKeyDown={(e) => e.key === 'Enter' && createNewNote()}
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

  // ===== Recording View =====
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

        {/* Manual Quick Add (mobile-first stacked) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manualEntry}
                onChange={(e) => {
                  const val = e.target.value;
                  setManualEntry(val);
                  const parsed = parseSpokenItem(val);
                  if (parsed) setManualParsed(parsed);
                }}
                placeholder="Type item & price e.g. 'sugar 100'"
                className="flex-1 border rounded-xl p-3 bg-gray-50"
              />
              <Button onClick={addManualItem} className="rounded-xl bg-green-600 hover:bg-green-700 h-12" disabled={!currentNote}>
                <Plus className="h-5 w-5 mr-2" /> Add Item
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                value={manualParsed.name}
                onChange={(e)=> setManualParsed((p)=>({...p, name: e.target.value}))}
                placeholder="Item name"
                className="rounded-xl"
              />
              <Input
                value={manualParsed.price}
                onChange={(e)=> setManualParsed((p)=>({...p, price: e.target.value}))}
                placeholder="Price"
                inputMode="decimal"
                className="rounded-xl"
              />
            </div>
          </div>
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

            <div>
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
                <p className="text-xs text-blue-500 mt-1">Confirm to add this item</p>
              </div>
            )}

            {/* The main Add Item button (label mirrors what you said) */}
            {transcript && (
              <Button
                onClick={() => parseAndAddItem(transcript)}
                className="w-full rounded-xl bg-green-600 hover:bg-green-700 h-12"
                disabled={!currentNote}
                title="Add the recognized item to the list"
              >
                <Plus className="h-5 w-5 mr-2" />
                {toTitleCase(transcript)}
              </Button>
            )}
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
                <div
                  key={item.id}
                  onTouchStart={onTouchStart(item.id)}
                  onTouchEnd={onTouchEnd(item.id)}
                  style={{
                    transition: 'transform 180ms ease, opacity 180ms ease',
                    transform: deletingId === item.id ? 'translateX(-80px)' : 'translateX(0)',
                    opacity: deletingId === item.id ? 0 : 1
                  }}
                  className="p-4 flex items-center justify-between group bg-white"
                >
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
                    <span className="font-semibold text-gray-900">₱{Number(item.price).toFixed(2)}</span>
                    {/* Easy remove button - always visible */}
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
                {currentNote.items.map((item) => (
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