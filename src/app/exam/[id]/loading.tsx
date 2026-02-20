import styles from "./page.module.css";

export default function ExamLoading() {
    return (
        <div className={styles.examPage}>
            {/* Header skeleton */}
            <header className={styles.examHeader}>
                <div className={styles.examHeaderInner}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ width: '60%', height: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 6 }} />
                        <div style={{ width: '40%', height: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 80, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 9999 }} />
                </div>
            </header>

            {/* Body skeleton */}
            <div className={styles.examBody}>
                <div className={styles.questionPanel}>
                    <div className={styles.questionCard}>
                        {/* Question number */}
                        <div style={{ width: 80, height: 28, background: 'var(--primary-light)', borderRadius: 9999, marginBottom: '1rem' }} />

                        {/* Question text lines */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.25rem' }}>
                            <div style={{ width: '100%', height: 16, background: 'var(--border)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                            <div style={{ width: '85%', height: 16, background: 'var(--border)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }} />
                        </div>

                        {/* Image placeholder */}
                        <div style={{ width: '100%', height: 200, background: 'var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }} />

                        {/* Answer options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} style={{
                                    height: 52,
                                    border: '2px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--card-bg)',
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                    animationDelay: `${i * 0.15}s`,
                                }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
