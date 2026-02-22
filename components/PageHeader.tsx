interface Props {
  titulo: string;
  descripcion: string;
}

export default function PageHeader({ titulo, descripcion }: Props) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '20px',
      padding: '28px 32px',
      marginBottom: '28px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Línea superior decorativa */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), rgba(88,28,135,0.6), transparent)',
      }} />
      <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#22d3ee', marginBottom: '6px' }}>
        {titulo}
      </h1>
      <p style={{ fontSize: '0.95rem', color: '#9ca3af', lineHeight: 1.6 }}>
        {descripcion}
      </p>
    </div>
  );
}