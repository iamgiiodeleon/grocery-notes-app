import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Mic, MicOff, Plus, ArrowLeft, Trash2, ShoppingCart, FileText, Calendar } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

// --- helpers ---
const capitalizeWords = (s) =>
  s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));

/**
 * Extract name (text) and price (number) from one combined string.
 * Supports: "sugar 100", "100 sugar", "sugar 100 pesos", "milk 85.50", "₱120 coke", "85 php milk"
 */
const parseTextToNamePrice = (raw) => {
  if (!raw) return null;
  const text = raw.toLowerCase().trim();

  // Remove currency words/symbols; normalize spaces
  const cleaned = text
    .replace(/(php|peso|pesos|piso|₱|\$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // First number (int/float) anywhere
  const numMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return null;

  const price = parseFloat(numMatch[1]);
  const name = cleaned.replace(numMatch[0], '').trim().replace(/\s{2,}/g, ' ');
  if (!name || isNaN(price)) return null;

  return { name, price };
};

const GroceryNotes = () => {
  const [currentView, setCurrentView] = useState('notes'); // 'notes' | 'recording'
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [newNoteName, setNewNoteName] = useState('');
  const [manualQuickAdd, setManualQuickAdd] = useState(''); // single input for "sugar 100"
  const [deletingId, setDeletingId] = useState(null); // for subtle delete animation
  const recognitionRef = useRef(null);
  const { toast } = useToast();

  // Load notes
  useEffect(() => {
    const savedNotes = localStorage.getItem('groceryNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Save notes
  useEffect(() => {
    localStorage.setItem('groceryNotes', JSON.stringify(notes));
  }, [notes]);

  // Speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const speechText = event.results[0][0].transcript.toLowerCase().trim();
        setTranscript(speechText);

        // Parse & add via voice immediately
        parseAndAddItem(speechText);

        toast({
          title: 'Processing...',
          description: `Heard: "${speechText}"`,
        });
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
        toast({
          title: 'Error',
          description: 'Speech recognition failed. Please try again.',
          variant: 'destructive',
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
        title: 'Error',
        description: 'No grocery list selected',
        variant: 'destructive',
      });
      return;
    }

    const parsed = parseTextToNamePrice(text);
    if (!parsed) {
      toast({
        title: 'Not Recognized',
        description: `Heard: "${text}". Try "item name price" format.`,
        variant: 'destructive',
      });
      return;
    }

    const itemName = parsed.name;
    const price = parsed.price;

    const newItem = {
      id: Date.now() + Math.random(),
      name: itemName,
      price,
      timestamp: new Date().toLocaleTimeString(),
    };

    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((note) =>
        note.id === currentNote.id
          ? {
              ...note,
              items: [...(note.items || []), newItem],
              lastModified: new Date().toLocaleString(),
            }
          : note
      );
      const updatedCurrent = updatedNotes.find((n) => n.id === currentNote.id);
      setCurrentNote(updatedCurrent);
      return updatedNotes;
    });

    toast({
      title: 'Added ✅',
      description: `${capitalizeWords(itemName)} - ₱${price.toFixed(2)}`,
    });
  };

  const createNewNote = () => {
    if (!newNoteName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your grocery list',
        variant: 'destructive',
      });
      return;
    }

    const newNote = {
      id: Date.now(),
      name: newNoteName.trim(),
      items: [],
      createdAt: new Date().toLocaleDateString(),
      lastModified: new Date().toLocaleString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setNewNoteName('');
    toast({
      title: 'Created',
      description: `"${newNote.name}" grocery list created`,
    });
  };

  const openNote = (note) => {
    const latestNote = notes.find((n) => n.id === note.id) || note;
    setCurrentNote(latestNote);
    setCurrentView('recording');
  };

  const deleteNote = (noteId) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
    if (currentNote && currentNote.id === noteId) {
      setCurrentNote(null);
      setCurrentView('notes');
    }
    toast({
      title: 'Deleted',
      description: 'Grocery list has been deleted',
    });
  };

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true);
      setTranscript('');
      recognitionRef.current.start();
      toast({
        title: 'Listening...',
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

  // swipe + animated delete
  const requestRemoveItem = (itemId) => {
    setDeletingId(itemId);
    setTimeout(() => {
      const updatedNotes = notes.map((note) =>
        note.id === currentNote.id
          ? {
              ...note,
              items: note.items.filter((item) => item.id !== itemId),
              lastModified: new Date().toLocaleString(),
            }
          : note
      );
      setNotes(updatedNotes);
      const updatedCurrent = updatedNotes.find((n) => n.id === currentNote.id);
      setCurrentNote(updatedCurrent);
      setDeletingId(null);
      toast({
        title: 'Removed',
        description: 'Item deleted from list',
      });
    }, 180); // subtle animation duration
  };

  const getTotalPrice = (items) => {
    return (items || []).reduce((sum, item) => sum + (item.price || 0), 0);
  };

  // ItemRow with swipe
  const ItemRow = ({ item, index }) => {
    const startXRef = useRef(null);
    const currentXRef = useRef(0);
    const [translate, setTranslate] = useState(0);

    const handleTouchStart = (e) => {
      startXRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      if (startXRef.current === null) return;
      const dx = e.touches[0].clientX - startXRef.current;
      currentXRef.current = dx;
      const limited = Math.max(Math.min(dx, 96), -96); // +/- 96px
      setTranslate(limited);
    };

    const handleTouchEnd = () => {
      const dx = currentXRef.current;
      const threshold = 72;
      if (Math.abs(dx) > threshold) {
        requestRemoveItem(item.id);
      } else {
        setTranslate(0);
      }
      startXRef.current = null;
      currentXRef.current = 0;
    };

    const deleting = deletingId === item.id;

    return (
      <div className="relative overflow-hidden">
        {/* background delete hint */}
        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
          <div className="opacity-60">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="opacity-60">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>

        <div
          className={[
            'p-4 flex items-center justify-between group bg-white relative',
            'transition-all duration-200 will-change-transform',
            deleting ? 'translate-x-full opacity-0' : '',
          ].join(' ')}
          style={{
            transform: `translateX(${translate}px)`,
            touchAction: 'pan-y',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => requestRemoveItem(item.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8 p-0 flex items-center justify-center"
              title="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (currentView === 'notes') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header */}
          <div className="text-center py-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Grocery Notes</h1>
            <p className="text-gray-600 text-sm">Voice-powered shopping lists</p>
          </div>

          {/* Create New Note */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-3">New List</h3>
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
                    className="p-4 sm:p-6 cursor-pointer active:bg-gray-50 transition-colors"
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
  const addButtonLabel = transcript
    ? `Add “${capitalizeWords(transcript)}”`
    : 'Add Item';

  const handleAddClick = () => {
    if (transcript) {
      return parseAndAddItem(transcript);
    }
    if (manualQuickAdd.trim()) {
      return parseAndAddItem(manualQuickAdd.trim());
    }
    toast({
      title: 'Nothing to add',
      description: 'Say something or type e.g. "sugar 100".',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between py-3">
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
        <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Amount</p>
          <p className="text-3xl font-bold text-gray-900">
            ₱{getTotalPrice(currentNote?.items || []).toFixed(2)}
          </p>
        </div>

        {/* Voice Recording */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="text-center space-y-3">
            <Button
              size="lg"
              className={`w-20 h-20 rounded-full transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg'
                  : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
              }`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
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
                <p className="text-xs text-blue-600 mb-1">Heard:</p>
                <p className="text-sm font-medium text-blue-800">"{transcript}"</p>
              </div>
            )}
          </div>

          {/* Manual quick add (combined field) + Add button (uses voice text if present) */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Input
              placeholder='Type e.g. "sugar 100"'
              value={manualQuickAdd}
              onChange={(e) => setManualQuickAdd(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddClick();
              }}
              className="rounded-xl border-gray-200 bg-gray-50 flex-1"
            />
            <Button
              onClick={handleAddClick}
              className="rounded-xl h-11 bg-green-600 hover:bg-green-700"
              title={transcript ? capitalizeWords(transcript) : 'Add item'}
            >
              <Plus className="h-5 w-5 mr-2" />
              {addButtonLabel}
            </Button>
          </div>

          {/* Dev test button preserved */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => parseAndAddItem(transcript || 'milk 85')}
              className="mt-1"
              disabled={!transcript && !currentNote}
            >
              {transcript ? `Test Add "${transcript}"` : 'Test Add "milk 85"'}
            </Button>
          )}
        </div>

        {/* Items List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {!currentNote?.items?.length ? (
            <div className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No items yet</p>
              <p className="text-gray-400 text-sm mt-1">Start recording or type to add items</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {currentNote.items.map((item, index) => (
                <ItemRow key={item.id} item={item} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Debug Info - optional */}
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