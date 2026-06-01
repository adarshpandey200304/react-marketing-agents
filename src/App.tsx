import { useCallback, useEffect, useRef, useState } from 'react';
import { useChatStore } from './store/useChatStore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WelcomeHero from './components/WelcomeHero';
import WorkflowStepper from './components/WorkflowStepper';
import MessageList from './components/MessageList';
import Composer from './components/Composer';
import DropOverlay from './components/DropOverlay';

// Frontend accept filter (§3).
const ACCEPT = '.pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg';
const ACCEPT_EXT = ACCEPT.split(',').map((e) => e.replace('.', '').toLowerCase());

function filterAccepted(files: File[]): File[] {
  return files.filter((f) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    return ACCEPT_EXT.includes(ext);
  });
}

export default function App() {
  const hasMessages = useChatStore((s) => s.messages.length > 0);
  const addFiles = useChatStore((s) => s.addFiles);
  const checkHealth = useChatStore((s) => s.checkHealth);
  const registerFilePicker = useChatStore((s) => s.registerFilePicker);
  const submitPendingUpload = useChatStore((s) => s.submitPendingUpload);
  const stagedCount = useChatStore((s) => s.stagedFiles.length);
  const pendingUploadText = useChatStore((s) => s.pendingUploadText);
  const processing = useChatStore((s) => s.processing);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  // Health polling for the connection dot (§9).
  useEffect(() => {
    void checkHealth();
    const id = setInterval(() => void checkHealth(), 20000);
    return () => clearInterval(id);
  }, [checkHealth]);

  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);

  // Let the store open the file picker (content_briefing button flow).
  useEffect(() => {
    registerFilePicker(openFilePicker);
  }, [registerFilePicker, openFilePicker]);

  // Auto-submit when files arrive after a content_briefing button (§5.2).
  useEffect(() => {
    if (stagedCount > 0 && pendingUploadText && !processing) {
      void submitPendingUpload();
    }
  }, [stagedCount, pendingUploadText, processing, submitPendingUpload]);

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = filterAccepted(Array.from(e.target.files ?? []));
    if (files.length) addFiles(files);
    e.target.value = ''; // allow re-selecting the same file
  };

  // Global drag-and-drop (§7 DropOverlay).
  const onDragEnter = (e: React.DragEvent) => {
    if (e.dataTransfer?.types?.includes('Files')) {
      dragDepth.current += 1;
      setDragging(true);
    }
  };
  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const files = filterAccepted(Array.from(e.dataTransfer.files ?? []));
    if (files.length) addFiles(files);
  };

  return (
    <div
      className="app"
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Header />
      <Sidebar />
      <main className="main">
        <div className="wf-stepper-slot">
          <WorkflowStepper />
        </div>
        {hasMessages ? <MessageList /> : <WelcomeHero onPickFiles={openFilePicker} />}
      </main>
      <Composer onPickFiles={openFilePicker} />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={onFilesSelected}
      />

      {dragging && <DropOverlay />}
    </div>
  );
}
