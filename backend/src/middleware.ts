import { Request, Response, NextFunction } from 'express'
import { ethers } from 'ethers'

export function validateAddress(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { address } = req.params

  if (!address) {
    return res.status(400).json({
      error: 'Missing address parameter',
      message: 'Please provide an Ethereum address as a path parameter',
    })
  }

  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      error: 'Invalid address format',
      message: `"${address}" is not a valid Ethereum address`,
    })
  }

  next()
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err)

  const statusCode = (err as any).statusCode || 500
  const message = err.message || 'Internal server error'

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
  })
}

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}
