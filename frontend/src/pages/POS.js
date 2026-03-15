import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline';

const POS = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedSection, setSelectedSection] = useState('lodge-dine'); // New state for section
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [orderType, setOrderType] = useState('dine-in');
  const [tableNumber, setTableNumber] = useState('');

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data } = await api.get('/menu');
      setMenuItems(data.data.filter(item => item.isAvailable));
    } catch (error) {
      toast.error('Failed to fetch menu items');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/menu/categories');
      setCategories(['all', ...data.data]);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(i => i.menuItemId === item.id);
    if (existingItem) {
      setCart(cart.map(i =>
        i.menuItemId === item.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setCart([...cart, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (menuItemId, delta) => {
    setCart(cart.map(item =>
      item.menuItemId === menuItemId
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (menuItemId) => {
    setCart(cart.filter(item => item.menuItemId !== menuItemId));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      const orderData = {
        orderType,
        section: selectedSection, // Include section in order
        tableNumber: orderType === 'dine-in' ? tableNumber : null,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        items: cart,
        paymentMethod: 'cash'
      };

      await api.post('/orders', orderData);
      toast.success(`Order created successfully for ${selectedSection === 'lodge-dine' ? 'Lodge-Dine' : 'Cafe-Restaurant'}!`);
      setCart([]);
      setCustomerInfo({ name: '', phone: '', email: '' });
      setTableNumber('');
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  const { subtotal, tax, total } = calculateTotal();
  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="h-[calc(100vh-200px)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>

        {/* Section Toggle */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSelectedSection('lodge-dine')}
            className={`px-6 py-2 rounded-md font-semibold transition-all ${selectedSection === 'lodge-dine'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Lodge-Dine
          </button>
          <button
            onClick={() => setSelectedSection('cafe-restaurant')}
            className={`px-6 py-2 rounded-md font-semibold transition-all ${selectedSection === 'cafe-restaurant'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Cafe-Restaurant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Menu Items */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 overflow-y-auto">
          {/* Section Badge */}
          <div className="mb-4 inline-block">
            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${selectedSection === 'lodge-dine'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
              }`}>
              {selectedSection === 'lodge-dine' ? '🏨 Lodge-Dine Section' : '☕ Cafe-Restaurant Section'}
            </span>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Menu Grid - Without Images */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="border-2 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-primary-500 transition-all bg-gradient-to-br from-white to-gray-50"
              >
                <div className="flex flex-col items-center justify-center py-4">
                  {/* Icon based on category */}
                  <div className="text-4xl mb-2">
                    {item.category === 'beverages' ? '☕' :
                      item.category === 'appetizers' ? '🍽️' :
                        item.category === 'main-course' ? '🍛' :
                          item.category === 'desserts' ? '🍰' :
                            item.category === 'snacks' ? '🥪' : '🍴'}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center mb-1">{item.name}</h3>
                  <p className="text-lg font-bold text-primary-600">₹{parseFloat(item.price).toFixed(2)}</p>
                  {item.category && (
                    <p className="text-xs text-gray-500 mt-1 capitalize">{item.category}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Order</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedSection === 'lodge-dine'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
              }`}>
              {selectedSection === 'lodge-dine' ? 'Lodge-Dine' : 'Cafe-Restaurant'}
            </span>
          </div>

          {/* Order Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="dine-in">Dine In</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>

          {orderType === 'dine-in' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Table #"
              />
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.menuItemId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">₹{parseFloat(item.price).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, -1)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, 1)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="p-1 rounded hover:bg-red-100 text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (10%):</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitOrder}
            disabled={cart.length === 0}
            className="mt-4 w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
