const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

const adminSchema = new mongoose.Schema({ username: { type: String, unique: true }, passwordHash: String });
const Admin = mongoose.model('Admin', adminSchema);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    let admin = await Admin.findOne({ username });
    if (!admin && process.env.ADMIN_PASSWORD_HASH) {
      // bootstrap admin
      admin = await Admin.create({ username, passwordHash: process.env.ADMIN_PASSWORD_HASH });
    }
    if (!admin) return res.status(401).json({ message: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });
    const token = jwt.sign({ sub: admin._id, role: 'admin' }, process.env.JWT_SECRET || 'dev', { expiresIn: '8h' });
    res.json({ token });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

const PORT = process.env.PORT || 4004;
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vai-coxinha');
    app.listen(PORT, () => console.log(`Admin service na porta ${PORT}`));
  } catch (err) {
    console.error('Falha ao iniciar admin-service', err);
    process.exit(1);
  }
})();


