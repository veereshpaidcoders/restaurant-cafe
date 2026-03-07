const User = require('./User');
const Order = require('./Order');
const MenuItem = require('./MenuItem');
const Customer = require('./Customer');
const Reservation = require('./Reservation');
const Schedule = require('./Schedule');
const Table = require('./Table');
const InventoryItem = require('./InventoryItem');
const AuditLog = require('./AuditLog');

// Define associations
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(Reservation, { foreignKey: 'customerId', as: 'reservations' });
Reservation.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Schedule, { foreignKey: 'userId', as: 'schedules' });
Schedule.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Order,
  MenuItem,
  Customer,
  Reservation,
  Schedule,
  Table,
  InventoryItem,
  AuditLog
};
