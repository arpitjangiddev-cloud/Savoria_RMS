require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Staff    = require('../models/Staff');
const MenuItem = require('../models/MenuItem');
const Table    = require('../models/Table');
const Order    = require('../models/Order');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data (drop collections to also reset unique indexes)
  const collections = ['users', 'staffs', 'menuitems', 'tables', 'orders'];
  for (const name of collections) {
    try { await mongoose.connection.db.dropCollection(name); } catch { /* may not exist */ }
  }
  console.log('Cleared existing data');

  // --- Users ---
  const adminUser = await User.create({
    name: 'Admin User', email: 'admin@restaurant.com', password: 'admin123', role: 'admin',
  });
  const managerUser = await User.create({
    name: 'Sara Khan', email: 'manager@restaurant.com', password: 'manager123', role: 'manager',
  });
  const staffUser = await User.create({
    name: 'Ravi Sharma', email: 'staff@restaurant.com', password: 'staff123', role: 'staff',
  });
  console.log('Users created');

  // --- Staff Profiles (created sequentially to avoid duplicate employeeId) ---
  await Staff.create({ user: managerUser._id, position: 'Manager', shift: 'Morning',   phone: '9876543210', salary: 45000 });
  await Staff.create({ user: staffUser._id,   position: 'Waiter',  shift: 'Afternoon', phone: '9876543211', salary: 22000 });
  console.log('Staff profiles created');

  // --- Menu Items ---
  const menuItems = await MenuItem.create([
    // Starters
    { name: 'Paneer Tikka',       category: 'Starters',     price: 280, description: 'Grilled cottage cheese with spices', preparationTime: 15, isAvailable: true, image: '/menu/paneer-tikka.png' },
    { name: 'Veg Spring Rolls',   category: 'Starters',     price: 180, description: 'Crispy rolls with veggie filling',    preparationTime: 12, isAvailable: true, image: '/menu/veg-spring-rolls.png' },
    { name: 'Soup of the Day',    category: 'Starters',     price: 120, description: 'Chef\'s special soup',               preparationTime: 10, isAvailable: true, image: '/menu/soup-of-the-day.png' },
    // Main Course
    { name: 'Butter Chicken',     category: 'Main Course',  price: 380, description: 'Creamy tomato-based chicken curry',  preparationTime: 25, isAvailable: true, image: '/menu/butter-chicken.png' },
    { name: 'Dal Makhani',        category: 'Main Course',  price: 260, description: 'Slow-cooked black lentils',          preparationTime: 20, isAvailable: true, image: '/menu/dal-makhani.png' },
    { name: 'Paneer Butter Masala', category: 'Main Course', price: 320, description: 'Rich paneer curry',                preparationTime: 20, isAvailable: true, image: '/menu/paneer-butter-masala.png' },
    { name: 'Chicken Biryani',    category: 'Main Course',  price: 420, description: 'Aromatic basmati rice with chicken', preparationTime: 30, isAvailable: true, image: '/menu/chicken-biryani.png' },
    { name: 'Veg Fried Rice',     category: 'Main Course',  price: 220, description: 'Wok-tossed rice with vegetables',   preparationTime: 15, isAvailable: true, image: '/menu/veg-fried-rice.png' },
    // Desserts
    { name: 'Gulab Jamun',        category: 'Desserts',     price: 120, description: 'Soft milk solids in sugar syrup',    preparationTime: 5,  isAvailable: true, image: '/menu/gulab-jamun.png' },
    { name: 'Mango Kulfi',        category: 'Desserts',     price: 140, description: 'Traditional Indian ice cream',       preparationTime: 5,  isAvailable: true, image: '/menu/mango-kulfi.png' },
    // Beverages
    { name: 'Masala Chai',        category: 'Beverages',    price: 60,  description: 'Spiced Indian tea',                  preparationTime: 5,  isAvailable: true, image: '/menu/masala-chai.png' },
    { name: 'Fresh Lime Soda',    category: 'Beverages',    price: 80,  description: 'Refreshing lime drink',              preparationTime: 3,  isAvailable: true, image: '/menu/fresh-lime-soda.png' },
    { name: 'Mango Lassi',        category: 'Beverages',    price: 100, description: 'Yogurt-based mango drink',           preparationTime: 5,  isAvailable: true, image: '/menu/mango-lassi.png' },
    // Specials
    { name: "Chef's Special Thali", category: 'Specials',   price: 480, description: 'Complete meal with 10 items',        preparationTime: 25, isAvailable: true, image: '/menu/chef-special-thali.png' },
  ]);
  console.log('Menu items created');

  // --- Tables ---
  const tables = await Table.create([
    { number: 1,  capacity: 2, location: 'Indoor',  status: 'available' },
    { number: 2,  capacity: 2, location: 'Indoor',  status: 'available' },
    { number: 3,  capacity: 4, location: 'Indoor',  status: 'available' },
    { number: 4,  capacity: 4, location: 'Indoor',  status: 'available' },
    { number: 5,  capacity: 4, location: 'Indoor',  status: 'available' },
    { number: 6,  capacity: 6, location: 'Indoor',  status: 'available' },
    { number: 7,  capacity: 6, location: 'Outdoor', status: 'available' },
    { number: 8,  capacity: 6, location: 'Outdoor', status: 'available' },
    { number: 9,  capacity: 8, location: 'Outdoor', status: 'available' },
    { number: 10, capacity: 2, location: 'Bar',     status: 'available' },
    { number: 11, capacity: 2, location: 'Bar',     status: 'available' },
    { number: 12, capacity: 4, location: 'VIP',     status: 'available' },
  ]);
  console.log('Tables created');

  // --- Orders (last 7 days for chart data) ---
  const orders = [];
  for (let d = 6; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const numOrders = Math.floor(Math.random() * 5) + 3;

    for (let o = 0; o < numOrders; o++) {
      const randomItems = menuItems.sort(() => 0.5 - Math.random()).slice(0, Math.ceil(Math.random() * 3) + 1);
      let subtotal = 0;
      const items = randomItems.map((mi) => {
        const qty = Math.ceil(Math.random() * 2);
        const sub = mi.price * qty;
        subtotal += sub;
        return { menuItem: mi._id, name: mi.name, price: mi.price, quantity: qty, subtotal: sub };
      });

      const tax      = parseFloat((subtotal * 0.05).toFixed(2));
      const total    = parseFloat((subtotal + tax).toFixed(2));
      const tableIdx = Math.floor(Math.random() * tables.length);

      orders.push({
        table:         tables[tableIdx]._id,
        tableNumber:   tables[tableIdx].number,
        items,
        status:        'served',
        paymentStatus: 'paid',
        paymentMethod: ['cash', 'card', 'upi'][Math.floor(Math.random() * 3)],
        subtotal,
        tax,
        discount: 0,
        total,
        servedBy:  staffUser._id,
        createdAt: date,
        updatedAt: date,
      });
    }
  }
  await Order.insertMany(orders);
  console.log(`${orders.length} orders seeded`);

  console.log('\n=============================');
  console.log('Seed complete! Demo credentials:');
  console.log('  Admin   → admin@restaurant.com   / admin123');
  console.log('  Manager → manager@restaurant.com / manager123');
  console.log('  Staff   → staff@restaurant.com   / staff123');
  console.log('=============================\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
