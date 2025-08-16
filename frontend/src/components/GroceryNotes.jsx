import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Mic, MicOff, Trash2, ShoppingCart } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const GroceryNotes = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const { toast } = useToast();

  // Load items from localStorage on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem('groceryItems');
    if (savedItems) {
      const parsedItems = JSON.parse(savedItems);
      setItems(parsedItems);
      const total = parsedItems.reduce((sum, item) => sum + item.price, 0);
      setTotalPrice(total);
    }
  }, []);

  // Save items to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('groceryItems', JSON.stringify(items));
    const total = items.reduce((sum, item) => sum + item.price, 0);
    setTotalPrice(total);
  }, [items]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const speechText = event.results[0][0].transcript;
        setTranscript(speechText);
        parseAndAddItem(speechText);
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
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
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
    // Parse text like "shampoo 100php" or "shampoo 100"
    const regex = /^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:php|peso|pesos)?$/i;
    const match = text.match(regex);
    
    if (match) {
      const itemName = match[1].trim();
      const price = parseFloat(match[2]);
      
      const newItem = {
        id: Date.now(),
        name: itemName,
        price: price,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setItems(prevItems => [...prevItems, newItem]);
      toast({
        title: "Item Added",
        description: `${itemName} - ₱${price.toFixed(2)}`,
      });
    } else {
      toast({
        title: "Unable to Parse",
        description: "Please say item name followed by price (e.g., 'shampoo 100')",
        variant: "destructive"
      });
    }
  };

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true);
      setTranscript('');
      recognitionRef.current.start();
      toast({
        title: "Listening...",
        description: "Say item name and price (e.g., 'shampoo 100php')",
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearAllItems = () => {
    setItems([]);
    setTotalPrice(0);
    localStorage.removeItem('groceryItems');
    toast({
      title: "Cleared",
      description: "All items have been removed.",
    });
  };

  const removeItem = (id) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    toast({
      title: "Item Removed",
      description: "Item has been deleted from your list.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center mb-3">
            <ShoppingCart className="h-8 w-8 text-green-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">Grocery Notes</h1>
          </div>
          <p className="text-gray-600">Voice-powered grocery list</p>
        </div>

        {/* Voice Recording Section */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Add New Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recording Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                className={`w-24 h-24 rounded-full transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>
            </div>
            
            {/* Recording Status */}
            <div className="text-center">
              {isRecording ? (
                <p className="text-red-600 font-medium">🎤 Listening... Tap to stop</p>
              ) : (
                <p className="text-gray-600">Tap to record item and price</p>
              )}
            </div>

            {/* Last Transcript */}
            {transcript && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Last heard:</p>
                <p className="font-medium">{transcript}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Price Display */}
        <Card className="shadow-lg bg-gradient-to-r from-blue-500 to-green-500 text-white">
          <CardContent className="text-center py-6">
            <h2 className="text-2xl font-bold mb-2">Total Amount</h2>
            <p className="text-4xl font-bold">₱{totalPrice.toFixed(2)}</p>
            <p className="text-blue-100 mt-1">{items.length} items</p>
          </CardContent>
        </Card>

        {/* Items List */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Grocery Items</CardTitle>
            {items.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllItems}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No items yet</p>
                <p className="text-sm">Start recording to add items</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {index + 1}
                        </Badge>
                        <span className="font-medium capitalize">{item.name}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{item.timestamp}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-600">₱{item.price.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="shadow-lg bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-amber-800 mb-2">How to Use:</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Tap the microphone button</li>
              <li>• Say item name and price (e.g., "shampoo 100")</li>
              <li>• The app will automatically parse and add to your list</li>
              <li>• Running total is calculated automatically</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroceryNotes;