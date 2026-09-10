const LOGO_SRC =
  typeof chrome !== 'undefined' && chrome.runtime?.getURL
    ? chrome.runtime.getURL('icons/icon.svg')
    : '/icons/icon.svg';

export function Logo({
  className = 'w-6 h-6',
  alt = 'Stop Play',
}: {
  className?: string;
  alt?: string;
  glow?: boolean;
}) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={`${className} shrink-0 object-contain drop-shadow-md select-none`}
      draggable={false}
    />
  );
}
