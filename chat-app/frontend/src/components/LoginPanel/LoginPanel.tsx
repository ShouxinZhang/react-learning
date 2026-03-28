import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './LoginPanel.module.css';

type Mode = 'login' | 'register';

export function LoginPanel() {
  const { login, register, loading, error, clearError } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [validationError, setValidationError] = useState('');

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setValidationError('');
    clearError();
  };

  const validate = (): boolean => {
    if (username.length < 3 || username.length > 20) {
      setValidationError('用户名需要 3-20 个字符');
      return false;
    }
    if (password.length < 6) {
      setValidationError('密码至少 6 个字符');
      return false;
    }
    if (mode === 'register') {
      if (password !== confirmPassword) {
        setValidationError('两次输入的密码不一致');
        return false;
      }
      if (!nickname.trim()) {
        setValidationError('请输入昵称');
        return false;
      }
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password, nickname.trim());
      }
    } catch {
      // error is already set in store
    }
  };

  const displayError = validationError || error;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Chat App</h1>
          <p>{mode === 'login' ? '登录你的账号' : '创建新账号'}</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'register' && (
            <>
              <div className={styles.field}>
                <label>确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.field}>
                <label>昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="请输入昵称"
                />
              </div>
            </>
          )}

          {displayError && <div className={styles.error}>{displayError}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? '请稍候...' : mode === 'login' ? '登 录' : '注 册'}
          </button>

          <div className={styles.toggle}>
            {mode === 'login' ? (
              <>
                还没有账号？
                <a onClick={() => switchMode('register')}>立即注册</a>
              </>
            ) : (
              <>
                已有账号？
                <a onClick={() => switchMode('login')}>立即登录</a>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPanel;
