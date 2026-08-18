'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createStoryAction } from '@/app/actions/admin-stories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

type InlineImage = { file: File; preview: string; alt: string };

export function NewStoryForm({
  collections,
}: {
  collections: { slug: string; label: string }[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [collection, setCollection] = useState(collections[0]?.label ?? '');
  const [collectionSlug, setCollectionSlug] = useState(collections[0]?.slug ?? '');
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('Onesugar');
  const [readTime, setReadTime] = useState(5);
  const [featured, setFeatured] = useState(false);
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [paragraphs, setParagraphs] = useState<string[]>(['']);
  const [inlineImages, setInlineImages] = useState<Record<number, InlineImage>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleTitleChange = (v: string) => {
    setTitle(v);
    setSlug(slugify(v));
  };

  const handleCollectionChange = (v: string) => {
    const found = collections.find((c) => c.label === v);
    setCollection(v);
    setCollectionSlug(found ? found.slug : slugify(v));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const addParagraph = () => setParagraphs((p) => [...p, '']);
  const removeParagraph = (i: number) => {
    setParagraphs((p) => p.filter((_, idx) => idx !== i));
    setInlineImages((prev) => {
      const next = { ...prev };
      delete next[i];
      return next;
    });
  };
  const updateParagraph = (i: number, v: string) =>
    setParagraphs((p) => p.map((x, idx) => (idx === i ? v : x)));

  const handleInlineImage = (afterIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInlineImages((prev) => ({
      ...prev,
      [afterIndex]: { file, preview: URL.createObjectURL(file), alt: prev[afterIndex]?.alt ?? '' },
    }));
  };

  const removeInlineImage = (afterIndex: number) => {
    setInlineImages((prev) => {
      const next = { ...prev };
      delete next[afterIndex];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !excerpt || paragraphs.filter((p) => p.trim()).length === 0) {
      setError('Preencha título, slug, excerto e pelo menos um parágrafo.');
      return;
    }
    setSubmitting(true);
    setError('');

    const fd = new FormData();
    fd.append('title', title);
    fd.append('slug', slug);
    fd.append('collection', collection);
    fd.append('collectionSlug', collectionSlug);
    fd.append('excerpt', excerpt);
    fd.append('author', author);
    fd.append('readTime', String(readTime));
    fd.append('featured', String(featured));
    fd.append('publishedAt', publishedAt);
    fd.append('paragraphCount', String(paragraphs.length));
    paragraphs.forEach((p, i) => fd.append(`paragraph_${i}`, p));
    if (coverFile) fd.append('coverImage', coverFile);

    const inlineMeta = Object.entries(inlineImages).map(([idx, img]) => ({
      afterIndex: Number(idx),
      alt: img.alt,
    }));
    fd.append('inlineImagesJson', JSON.stringify(inlineMeta));
    inlineMeta.forEach(({ afterIndex }) => {
      fd.append(`inlineImage_${afterIndex}`, inlineImages[afterIndex].file);
    });

    try {
      const result = await createStoryAction(fd);
      if (result.success) {
        router.push('/admin/contos');
        router.refresh();
      } else {
        setError(result.error ?? 'Erro desconhecido');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* ── Basic info ── */}
      <section className="border border-border rounded-xl p-6 space-y-5">
        <h2 className="font-bold text-lg">Metadados</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Título do conto"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="titulo-do-conto"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="collection">Coleção</Label>
            <Input
              id="collection"
              list="collections-list"
              value={collection}
              onChange={(e) => handleCollectionChange(e.target.value)}
              placeholder="Nome da coleção"
              required
            />
            <datalist id="collections-list">
              {collections.map((c) => (
                <option key={c.slug} value={c.label} />
              ))}
            </datalist>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="excerpt">Excerto (resumo do card)</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="Breve descrição que aparece no card..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="author">Autor</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="readTime">Tempo de leitura (min)</Label>
            <Input
              id="readTime"
              type="number"
              min={1}
              max={60}
              value={readTime}
              onChange={(e) => setReadTime(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publishedAt">Data de publicação</Label>
            <Input
              id="publishedAt"
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
            />
          </div>

          <div className="col-span-2 flex items-center gap-3">
            <input
              id="featured"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 accent-rose-600"
            />
            <Label htmlFor="featured">Marcar como história em destaque</Label>
          </div>
        </div>
      </section>

      {/* ── Cover image ── */}
      <section className="border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-bold text-lg">Imagem de capa</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          className="block text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-600 file:text-white hover:file:bg-rose-700 cursor-pointer"
        />
        {coverPreview && (
          <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-border">
            <Image src={coverPreview} alt="Preview" fill className="object-cover" />
          </div>
        )}
      </section>

      {/* ── Paragraphs ── */}
      <section className="border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-bold text-lg">Conteúdo do conto</h2>

        {paragraphs.map((p, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Parágrafo {i + 1}
              </span>
              {paragraphs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeParagraph(i)}
                  className="text-xs text-red-500 hover:text-red-400 ml-auto"
                >
                  Remover
                </button>
              )}
            </div>
            <Textarea
              value={p}
              onChange={(e) => updateParagraph(i, e.target.value)}
              rows={4}
              placeholder={`Texto do parágrafo ${i + 1}...`}
              className="resize-y"
            />

            {/* Inline image after this paragraph */}
            <div className="pl-3 border-l-2 border-border space-y-2">
              {inlineImages[i] ? (
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0">
                    <Image src={inlineImages[i].preview} alt="inline" fill className="object-cover" />
                  </div>
                  <Input
                    value={inlineImages[i].alt}
                    onChange={(e) =>
                      setInlineImages((prev) => ({
                        ...prev,
                        [i]: { ...prev[i], alt: e.target.value },
                      }))
                    }
                    placeholder="Texto alternativo da imagem"
                    className="text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeInlineImage(i)}
                    className="text-xs text-red-500 shrink-0"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors inline-flex items-center gap-1.5">
                  <span>+ Adicionar imagem após este parágrafo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleInlineImage(i, e)}
                  />
                </label>
              )}
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addParagraph} className="w-full">
          + Adicionar parágrafo
        </Button>
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="bg-rose-600 hover:bg-rose-700 text-white">
          {submitting ? 'A publicar...' : 'Publicar conto'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/contos')}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
