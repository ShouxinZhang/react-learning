import styles from './UserAvatar.module.css';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

const SIZES = { sm: 32, md: 40, lg: 48 } as const;

const COLORS = [
  '#e06c75', '#e5c07b', '#98c379', '#56b6c2',
  '#61afef', '#c678dd', '#d19a66', '#be5046',
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function UserAvatar({ src, name, size = 'md', online }: UserAvatarProps) {
  const px = SIZES[size];
  const letter = name.charAt(0).toUpperCase();
  const bg = COLORS[hashName(name) % COLORS.length];

  return (
    <div className={styles.wrapper} style={{ width: px, height: px }}>
      {src ? (
        <img
          className={styles.image}
          src={src}
          alt={name}
          width={px}
          height={px}
        />
      ) : (
        <div
          className={styles.fallback}
          style={{ backgroundColor: bg, fontSize: px * 0.45 }}
        >
          {letter}
        </div>
      )}
      {online && <span className={styles.indicator} />}
    </div>
  );
}

export default UserAvatar;
