import { prisma } from "../src/prismaClient";
async function main() {
    const result = await prisma.movement.deleteMany({});
    console.log(`Eliminados ${result.count} movimientos.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
