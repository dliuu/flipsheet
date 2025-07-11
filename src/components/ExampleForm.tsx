'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

interface Message {
  id: number;
  content: string;
  created_at: string;
}

export default function ExampleForm() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ content: message.trim() }]);

      if (error) {
        console.error('Error inserting message:', error);
        alert('Error saving message. Make sure you have a "messages" table in your Supabase database.');
        return;
      }

      setMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Example Form</h3>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-3">Messages</h4>
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No messages yet. Add a message above to see it here!
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900">{msg.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This example requires a "messages" table in your Supabase database. 
          Create a table with columns: id (int, primary key), content (text), created_at (timestamp).
        </p>
      </div>
    </div>
  );
} 