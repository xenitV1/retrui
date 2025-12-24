import { PrismaClient } from '../../generated/prisma'
import { withAccelerate } from '@prisma/extension-accelerate'

const prismaClientSingleton = () => {
    return new PrismaClient({
        accelerateUrl: process.env.DATABASE_URL!
    }).$extends(withAccelerate())
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
