-- CreateEnum
CREATE TYPE "NewsStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "PublicDocumentCategory" AS ENUM ('ESTATUTOS', 'REGLAMENTOS', 'LINEAMIENTOS', 'COMUNICADOS');

-- CreateEnum
CREATE TYPE "PublicDocumentStatus" AS ENUM ('PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "NewsStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "cover_photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_documents" (
    "id" TEXT NOT NULL,
    "category" "PublicDocumentCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pdf_url" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "status" "PublicDocumentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_key" ON "news"("slug");
