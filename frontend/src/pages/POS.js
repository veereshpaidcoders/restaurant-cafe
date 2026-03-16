import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { toast } from 'react-toastify';
import { PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline';

const POS = () => {
  const { user } = useSelector(state => state.auth);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);

  // Set initial section based on user's role and section
  const getInitialSection = () => {
    if (user?.role === 'captain' && user?.section) {
      return user.section;
    }
    return 'lodge-dine';
  };

  const [selectedSection, setSelectedSection] = useState(getInitialSection());
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
    fetchAvailableTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update section when user changes
  useEffect(() => {
    if (user?.role === 'captain' && user?.section) {
      setSelectedSection(user.section);
    }
  }, [user]);

  // Fetch available tables when section changes
  useEffect(() => {
    fetchAvailableTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection]);

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

  const fetchAvailableTables = async () => {
    try {
      const { data } = await api.get(`/tables?section=${selectedSection}&status=available`);
      setAvailableTables(data.data || []);
    } catch (error) {
      console.error('Failed to fetch available tables');
      setAvailableTables([]);
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

    // Validate table number for dine-in orders
    if (orderType === 'dine-in' && !tableNumber) {
      toast.error('Please enter a table number for dine-in orders');
      return;
    }

    // Check table availability for dine-in orders
    if (orderType === 'dine-in' && tableNumber) {
      try {
        const { data } = await api.get(`/tables/availability/${selectedSection}/${tableNumber}`);

        if (!data.available) {
          toast.error(data.message || `Table ${tableNumber} is not available`);
          return;
        }
      } catch (error) {
        // If error checking availability, still allow order but warn
        console.error('Error checking table availability:', error);
      }
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
      toast.success(`Order created successfully for ${selectedSection === 'lodge-dine' ? 'Lodge-Dine' : 'Cafe-Restaurant'}!${orderType === 'dine-in' ? ` Table ${tableNumber} is now occupied.` : ''}`);
      setCart([]);
      setCustomerInfo({ name: '', phone: '', email: '' });
      setTableNumber('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create order';
      toast.error(errorMessage);
    }
  };

  const { subtotal, tax, total } = calculateTotal();

  // Filter items by section first, then by category
  const sectionFilteredItems = menuItems.filter(item => {
    // Show items that are assigned to this section or to 'both'
    return item.section === selectedSection || item.section === 'both';
  });

  const filteredItems = selectedCategory === 'all'
    ? sectionFilteredItems
    : sectionFilteredItems.filter(item => item.category === selectedCategory);

  return (
    <div className="h-[calc(100vh-200px)]">
      {/* Compact Header for Tablet Landscape - Reduced vertical space */}
      <div className="flex justify-between items-center mb-2 md:mb-3 lg:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-gray-900">POS</h1>

        {/* Section Toggle - Compact for tablets - Disabled for captains */}
        <div className="flex gap-1 sm:gap-1.5 md:gap-2 bg-gray-100 p-0.5 sm:p-0.5 md:p-1 rounded-md md:rounded-lg">
          <button
            onClick={() => user?.role !== 'captain' && setSelectedSection('lodge-dine')}
            disabled={user?.role === 'captain' && user?.section !== 'lodge-dine'}
            className={`px-3 py-1 sm:px-4 sm:py-1.5 md:px-6 md:py-2 rounded text-xs sm:text-sm md:text-base font-semibold transition-all ${selectedSection === 'lodge-dine'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              } ${user?.role === 'captain' && user?.section !== 'lodge-dine' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Lodge-Dine
          </button>
          <button
            onClick={() => user?.role !== 'captain' && setSelectedSection('cafe-restaurant')}
            disabled={user?.role === 'captain' && user?.section !== 'cafe-restaurant'}
            className={`px-3 py-1 sm:px-4 sm:py-1.5 md:px-6 md:py-2 rounded text-xs sm:text-sm md:text-base font-semibold transition-all ${selectedSection === 'cafe-restaurant'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              } ${user?.role === 'captain' && user?.section !== 'cafe-restaurant' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cafe-Restaurant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Menu Items */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-3 sm:p-4 md:p-4 lg:p-6 overflow-y-auto">
          {/* Section Badge - Compact */}
          <div className="mb-2 md:mb-3 lg:mb-4 inline-block">
            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-1 rounded-full text-xs sm:text-sm font-semibold ${selectedSection === 'lodge-dine'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
              }`}>
              {selectedSection === 'lodge-dine' ? '🏨 Lodge-Dine' : '☕ Cafe-Restaurant'}
            </span>
          </div>

          {/* Category Filter - Compact */}
          <div className="flex gap-1 sm:gap-1.5 md:gap-2 mb-3 md:mb-4 lg:mb-6 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-md md:rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap ${selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Menu Grid - Optimized for tablet landscape with smaller items */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5 md:gap-2.5 lg:gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="border-2 rounded-lg p-2 sm:p-2.5 md:p-2.5 lg:p-4 cursor-pointer hover:shadow-lg hover:border-primary-500 transition-all bg-gradient-to-br from-white to-gray-50 active:scale-95 min-h-[100px] sm:min-h-[110px] md:min-h-[120px] lg:min-h-[160px]"
              >
                <div className="flex flex-col items-center justify-center h-full py-2 sm:py-2.5 md:py-3 lg:py-5">
                  {/* Icon based on category - Smaller on tablets */}
                  <div className="text-xl sm:text-2xl md:text-2xl lg:text-4xl mb-1 sm:mb-1.5 md:mb-1.5 lg:mb-2">
                    {item.category === 'breakfast' ? '🍳' :
                      item.category === 'beverages' ? '☕' :
                        item.category === 'appetizers' ? '🍽️' :
                          item.category === 'main-course' ? '🍛' :
                            item.category === 'desserts' ? '🍰' :
                              item.category === 'snacks' ? '🥪' : '🍴'}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center mb-1 text-xs sm:text-xs md:text-xs lg:text-base line-clamp-2 px-1">{item.name}</h3>
                  <p className="text-xs sm:text-sm md:text-sm lg:text-lg font-bold text-primary-600 mb-0.5">₹{parseFloat(item.price).toFixed(2)}</p>
                  {item.category && (
                    <p className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-xs text-gray-500 capitalize line-clamp-1">{item.category}</p>
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
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Table</option>
                {availableTables.map(table => (
                  <option key={table.id} value={table.tableNumber}>
                    {table.tableNumber} - {table.seats} seats ({table.location || 'No location'})
                  </option>
                ))}
              </select>
              {availableTables.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No available tables in {selectedSection}</p>
              )}
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
