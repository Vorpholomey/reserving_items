-- Удаляем уникальный индекс с bookingId (уникальность теперь на паре authorId+bookingId)
DROP INDEX "reviews_bookingId_key";

-- Добавляем FOREIGN KEY для targetId -> User
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Добавляем уникальное ограничение на пару authorId + bookingId
CREATE UNIQUE INDEX "reviews_authorId_bookingId_key" ON "reviews"("authorId", "bookingId");
