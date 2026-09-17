import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { SPRING } from '../../styles/motion';
import './ModalOverlay.css';

/** Fondo modal genérico: cierra con Escape o clic fuera del contenido. */
export function ModalOverlay({ onClose, wrapperClass, children }) {
  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', manejarTecla);
    return () => document.removeEventListener('keydown', manejarTecla);
  }, [onClose]);

  return (
    <motion.div
      className="csf-overlay"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className={['csf-wrapper', wrapperClass].filter(Boolean).join(' ')}
        initial={{ y: 12, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 12, scale: 0.98, opacity: 0, transition: { duration: 0.18 } }}
        transition={SPRING.default}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

ModalOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
  wrapperClass: PropTypes.string,
  children: PropTypes.node.isRequired,
};
