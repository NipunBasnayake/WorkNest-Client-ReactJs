import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileQuestion, Fullscreen, LoaderCircle, Maximize2, Minus, Move, Plus, RotateCcw } from 'lucide-react';
import { EmptyState } from '@/components/common/AppUI';
import { useProtectedFileResource } from '@/hooks/useProtectedFileUrl';

interface CvViewerProps {
  src?: string;
  fileName?: string;
  mimeType?: string;
  applicantName: string;
}

const controlClass = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors hover:bg-primary-500/[.06] disabled:cursor-not-allowed disabled:opacity-45';
const controlStyle = { borderColor: 'var(--border-default)', color: 'var(--text-secondary)' };

function fileKind(mimeType?: string, fileName?: string): 'pdf' | 'image' | 'other' {
  const mime = mimeType?.toLowerCase() ?? '';
  const extension = fileName?.split('.').pop()?.toLowerCase() ?? '';
  if (mime.includes('pdf') || extension === 'pdf') return 'pdf';
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) return 'image';
  return 'other';
}

function FileActions({ src, fileName }: { src: string; fileName?: string }) {
  return <>
    <a className={controlClass} style={controlStyle} href={src} download={fileName || 'cv'}>
      <Download size={14} />Download
    </a>
    <a className={controlClass} style={controlStyle} href={src} target='_blank' rel='noreferrer'>
      <ExternalLink size={14} />Open
    </a>
  </>;
}

export function CvViewer({ src, fileName, mimeType, applicantName }: CvViewerProps) {
  const protectedFile = useProtectedFileResource(src);
  if (!src) {
    return <EmptyState icon={<FileQuestion size={30} />} title='No CV uploaded' description='This applicant did not attach a CV to the application.' />;
  }
  if (protectedFile.isLoading) return <CvResourceState />;
  if (protectedFile.isError || !protectedFile.url) return <CvResourceState error />;

  const kind = fileKind(mimeType, fileName);
  if (kind === 'pdf') return <PdfViewer key={protectedFile.url} src={protectedFile.url} fileName={fileName} applicantName={applicantName} />;
  if (kind === 'image') return <ImageViewer key={protectedFile.url} src={protectedFile.url} fileName={fileName} applicantName={applicantName} />;

  return <div className='rounded-xl border p-6 text-center' style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}>
    <FileQuestion size={28} className='mx-auto text-primary-600' />
    <p className='mt-3 font-medium' style={{ color: 'var(--text-primary)' }}>{fileName ?? 'CV attached'}</p>
    <p className='mt-1 text-sm' style={{ color: 'var(--text-secondary)' }}>This file type cannot be previewed safely in the browser.</p>
    <div className='mt-4 flex flex-wrap justify-center gap-2'><FileActions src={protectedFile.url} fileName={fileName} /></div>
  </div>;
}

function CvResourceState({ error = false }: { error?: boolean }) {
  return <div className='relative h-64 overflow-hidden rounded-xl border' style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}>
    {error
      ? <div className='absolute inset-0 grid place-items-center p-6 text-center'><div><FileQuestion size={30} className='mx-auto text-primary-600' /><p className='mt-3 font-semibold' style={{ color: 'var(--text-primary)' }}>CV could not be loaded</p><p className='mt-1 text-sm' style={{ color: 'var(--text-secondary)' }}>The protected file request failed. Refresh the page or try again.</p></div></div>
      : <ViewerStatus label='Loading CV…' />}
  </div>;
}

function PdfViewer({ src, fileName, applicantName }: { src: string; fileName?: string; applicantName: string }) {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState<number | 'page-width'>('page-width');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const viewerUrl = useMemo(() => {
    const base = src.split('#')[0];
    return `${base}#page=${page}&zoom=${zoom === 'page-width' ? 'page-width' : zoom}&toolbar=1&navpanes=0&scrollbar=1`;
  }, [page, src, zoom]);

  function changePage(nextPage: number) {
    setLoading(true);
    setError(false);
    setPage(Math.max(1, nextPage));
  }

  function changeZoom(nextZoom: number | 'page-width') {
    setLoading(true);
    setError(false);
    setZoom(nextZoom);
  }

  const numericZoom = zoom === 'page-width' ? 100 : zoom;
  return <div className='overflow-hidden rounded-xl border' style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}>
    <div className='flex flex-wrap items-center justify-between gap-2 border-b p-2.5' style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}>
      <div className='flex flex-wrap items-center gap-2'>
        <button type='button' className={controlClass} style={controlStyle} onClick={() => changePage(page - 1)} disabled={page === 1} aria-label='Previous PDF page'><ChevronLeft size={14} /></button>
        <label className='flex h-9 items-center gap-1 rounded-lg border px-2 text-xs' style={controlStyle}>Page<input aria-label='PDF page number' type='number' min={1} value={page} onChange={(event) => changePage(Number(event.target.value) || 1)} className='w-12 bg-transparent text-center outline-none' /></label>
        <button type='button' className={controlClass} style={controlStyle} onClick={() => changePage(page + 1)} aria-label='Next PDF page'><ChevronRight size={14} /></button>
        <button type='button' className={controlClass} style={controlStyle} onClick={() => changeZoom(Math.max(50, numericZoom - 25))} aria-label='Zoom PDF out'><Minus size={14} /></button>
        <span className='min-w-12 text-center text-xs font-semibold' style={{ color: 'var(--text-secondary)' }}>{zoom === 'page-width' ? 'Fit' : `${zoom}%`}</span>
        <button type='button' className={controlClass} style={controlStyle} onClick={() => changeZoom(Math.min(300, numericZoom + 25))} aria-label='Zoom PDF in'><Plus size={14} /></button>
        <button type='button' className={controlClass} style={controlStyle} onClick={() => changeZoom('page-width')}><Maximize2 size={14} />Fit width</button>
      </div>
      <div className='flex flex-wrap gap-2'><FileActions src={src} fileName={fileName} /></div>
    </div>
    <div className='relative h-[38rem] min-h-96'>
      {loading && !error ? <ViewerStatus label='Loading PDF…' /> : null}
      {error ? <ViewerError src={src} fileName={fileName} /> : null}
      {!error ? <iframe title={`${applicantName} CV`} src={viewerUrl} className='h-full w-full border-0' onLoad={() => setLoading(false)} onError={() => { setLoading(false); setError(true); }} /> : null}
    </div>
  </div>;
}

function ImageViewer({ src, fileName, applicantName }: { src: string; fileName?: string; applicantName: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (scale <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
  }

  function pan(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    setOffset({ x: dragStart.current.offsetX + event.clientX - dragStart.current.x, y: dragStart.current.offsetY + event.clientY - dragStart.current.y });
  }

  function stopPan() {
    dragStart.current = null;
  }

  function resetView() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  return <div ref={containerRef} className='overflow-hidden rounded-xl border' style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}>
    <div className='flex flex-wrap items-center justify-between gap-2 border-b p-2.5' style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}>
      <div className='flex flex-wrap items-center gap-2'>
        <button type='button' className={controlClass} style={controlStyle} onClick={() => setScale((value) => Math.max(0.5, value - 0.25))} aria-label='Zoom image out'><Minus size={14} /></button>
        <span className='min-w-12 text-center text-xs font-semibold' style={{ color: 'var(--text-secondary)' }}>{Math.round(scale * 100)}%</span>
        <button type='button' className={controlClass} style={controlStyle} onClick={() => setScale((value) => Math.min(4, value + 0.25))} aria-label='Zoom image in'><Plus size={14} /></button>
        <button type='button' className={controlClass} style={controlStyle} onClick={resetView}><RotateCcw size={14} />Fit</button>
        <span className='hidden items-center gap-1 text-xs sm:inline-flex' style={{ color: 'var(--text-tertiary)' }}><Move size={13} />Drag to pan</span>
        <button type='button' className={controlClass} style={controlStyle} onClick={() => void containerRef.current?.requestFullscreen()}><Fullscreen size={14} />Fullscreen</button>
      </div>
      <div className='flex flex-wrap gap-2'><FileActions src={src} fileName={fileName} /></div>
    </div>
    <div className={`relative h-[38rem] min-h-96 overflow-hidden touch-none ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`} onPointerDown={startPan} onPointerMove={pan} onPointerUp={stopPan} onPointerCancel={stopPan}>
      {loading && !error ? <ViewerStatus label='Loading image…' /> : null}
      {error ? <ViewerError src={src} fileName={fileName} /> : null}
      {!error ? <img src={src} alt={`${applicantName} CV`} className='h-full w-full select-none object-contain transition-transform duration-100' draggable={false} style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }} onLoad={() => setLoading(false)} onError={() => { setLoading(false); setError(true); }} /> : null}
    </div>
  </div>;
}

function ViewerStatus({ label }: { label: string }) {
  return <div className='absolute inset-0 z-10 grid place-items-center' style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}><span className='flex items-center gap-2 text-sm font-medium'><LoaderCircle size={18} className='animate-spin' />{label}</span></div>;
}

function ViewerError({ src, fileName }: { src: string; fileName?: string }) {
  return <div className='absolute inset-0 grid place-items-center p-6 text-center' style={{ background: 'var(--bg-muted)' }}><div><FileQuestion size={30} className='mx-auto text-primary-600' /><p className='mt-3 font-semibold' style={{ color: 'var(--text-primary)' }}>CV preview unavailable</p><p className='mt-1 text-sm' style={{ color: 'var(--text-secondary)' }}>The file could not be rendered in the browser.</p><div className='mt-4 flex justify-center gap-2'><FileActions src={src} fileName={fileName} /></div></div></div>;
}
