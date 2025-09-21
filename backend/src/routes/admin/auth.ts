import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { body, validationResult } from 'express-validator'

const router = Router()
const prisma = new PrismaClient()

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '24h'

// Middleware for validation errors
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

// Middleware for JWT verification
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// Admin login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body

    // Find admin user
    const admin = await prisma.user.findFirst({
      where: {
        email,
        role: 'admin'
      }
    })

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, admin.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: admin.id, 
        email: admin.email, 
        role: admin.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // Update last login
    await prisma.user.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    })

    res.json({
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        createdAt: admin.createdAt
      }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  })
})

// Refresh token
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    const newToken = jwt.sign(
      { 
        userId: req.user.userId, 
        email: req.user.email, 
        role: req.user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({ token: newToken })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get current admin info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLogin: true
      }
    })

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' })
    }

    res.json({ admin })
  } catch (error) {
    console.error('Get admin info error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Update admin profile
router.put('/profile', authenticateToken, [
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail()
], handleValidationErrors, async (req, res) => {
  try {
    const { name, email } = req.body
    const userId = req.user.userId

    // Check if email already exists (if email is being updated)
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      })

      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' })
      }
    }

    const updatedAdmin = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    res.json({ admin: updatedAdmin })
  } catch (error) {
    console.error('Update admin profile error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Change password
router.put('/password', authenticateToken, [
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 8 })
], handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.userId

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export { router as adminAuthRouter, authenticateToken }