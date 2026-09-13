import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiServiceService } from './servicios/api.service.service';
import { env } from './enviroments/env';

export interface OfertaItem {
  id: number;
  valor: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Módulo de Creación de Convenios y Folios Red+Chapur';

  // Inyección del servicio API
  private apiService = inject(ApiServiceService);

  // Pestaña activa actual (1, 2, 3 o 4)
  activeTab = signal<number>(1);

  // Pestaña 1: Identificación y Token
  idConvenio = signal<string>('');
  idUsuario = signal<string>(env.id_usuario.toString());
  token = signal<string>('');
  mostrarToken = signal<boolean>(false);

  // Pestaña 2: Nombre y Descripción del Convenio
  nombreConvenio = signal<string>('');
  descripcionConvenio = signal<string>('');

  // Pestaña 3: Prefijo y Número de Folios
  prefijoConvenio = signal<string>('');
  numeroFolios = signal<string>('');

  // Pestaña 4: Cajas dinámicas de Id Oferta (mínimo 1)
  private nextOfertaId = 2;
  ofertas = signal<OfertaItem[]>([
    { id: 1, valor: '' }
  ]);

  // Mensaje de notificación o feedback de ejecución
  mensajeEjecucion = signal<string | null>(null);
  tipoMensaje = signal<'info' | 'success' | 'error'>('info');

  // Mostrar panel de resumen de datos capturados
  mostrarResumen = signal<boolean>(false);

  // Indicador de carga mientras se ejecuta la petición
  cargando = signal<boolean>(false);

  /**
   * Cambiar de pestaña
   */
  setTab(tabNumber: number): void {
    this.activeTab.set(tabNumber);
  }

  /**
   * Alternar visibilidad de token
   */
  toggleMostrarToken(): void {
    this.mostrarToken.update(v => !v);
  }

  /**
   * Tab 4: Adicionar una nueva caja de texto para Id Oferta
   */
  adicionarOferta(): void {
    const nuevoElemento: OfertaItem = {
      id: this.nextOfertaId++,
      valor: ''
    };
    this.ofertas.update(lista => [...lista, nuevoElemento]);
    this.mostrarNotificacion(`Se adicionó la caja de Oferta #${this.ofertas().length}`, 'info');
  }

  /**
   * Tab 4: Quitar una caja de texto (asegurando siempre al menos 1 caja)
   */
  quitarOferta(index?: number): void {
    const items = this.ofertas();
    if (items.length <= 1) {
      this.mostrarNotificacion('Debe existir como mínimo una caja de ID Oferta.', 'info');
      return;
    }

    if (typeof index === 'number') {
      this.ofertas.update(lista => lista.filter((_, i) => i !== index));
    } else {
      this.ofertas.update(lista => lista.slice(0, -1));
    }

    this.mostrarNotificacion(`Se quitó una caja de oferta. Quedan ${this.ofertas().length} caja(s).`, 'info');
  }

  /**
   * Actualizar valor de una oferta específica
   */
  actualizarOferta(index: number, valor: string): void {
    this.ofertas.update(lista => {
      const nuevaLista = [...lista];
      if (nuevaLista[index]) {
        nuevaLista[index] = { ...nuevaLista[index], valor };
      }
      return nuevaLista;
    });
  }

  /**
   * Validaciones mínimas antes de ejecutar la petición
   */
  private validarDatosConvenio(): boolean {
    if (!this.token().trim()) {
      this.mostrarNotificacion('El Token es obligatorio. Vuelva al Paso 1.', 'error');
      this.setTab(1);
      return false;
    }
    if (!this.nombreConvenio().trim()) {
      this.mostrarNotificacion('El Nombre del Convenio es obligatorio.', 'error');
      return false;
    }
    if (!this.descripcionConvenio().trim()) {
      this.mostrarNotificacion('La Descripción del Convenio es obligatoria.', 'error');
      return false;
    }
    return true;
  }

  /**
   * Acción de botón "Ejecutar" - Tab 2: Crear Convenio
   */
  ejecutar(origen: string): void {
  if (origen.includes('Tab 2')) {
    this.crearConvenio();
  } else if (origen.includes('Tab 3')) {
    this.crearFolios();
  } else {
    this.mostrarNotificacion(
      `Acción "Ejecutar" disparada desde: ${origen}. (Modo captura activo)`,
      'success'
    );
  }
}


  /**
   * Tab 2: Envía la petición POST para crear el convenio
   */
  private crearConvenio(): void {
    if (!this.validarDatosConvenio()) {
      return;
    }

    // Payload que se enviará al endpoint
    const payload = {
      fechaInicio: '',
      fechaFin: '',
      idUsuarioAlta: Number(this.idUsuario()),
      nombre: this.nombreConvenio().trim(),
      descripcion: this.descripcionConvenio().trim()
    };

    this.cargando.set(true);
    this.mostrarNotificacion('Enviando petición para crear el convenio...', 'info');

    this.apiService.crearConvenio(payload, this.token()).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        console.log('Respuesta del servidor:', respuesta);
        this.mostrarNotificacion(
          '✅ Convenio creado exitosamente.',
          'success'
        );
      },
      error: (error) => {
        this.cargando.set(false);
        console.error('Error al crear convenio:', error);
        const mensaje = error?.error?.message
          || error?.message
          || 'Error desconocido al crear el convenio.';
        this.mostrarNotificacion(`❌ ${mensaje}`, 'error');
      }
    });
  }


  /**
 * Tab 3: Envía la petición POST para crear los folios
 */
private crearFolios(): void {
  // Validaciones
  if (!this.token().trim()) {
    this.mostrarNotificacion('El Token es obligatorio. Vuelva al Paso 1.', 'error');
    this.setTab(1);
    return;
  }
  if (!this.idConvenio().trim()) {
    this.mostrarNotificacion('El ID del Convenio es obligatorio. Vuelva al Paso 1.', 'error');
    this.setTab(1);
    return;
  }
  if (!this.prefijoConvenio().trim()) {
    this.mostrarNotificacion('El Prefijo del Convenio es obligatorio.', 'error');
    return;
  }
  if (!this.numeroFolios() || Number(this.numeroFolios()) <= 0) {
    this.mostrarNotificacion('El Número de Folios debe ser mayor a 0.', 'error');
    return;
  }

  // Payload según el request de Postman
  const payload = {
    idConvenio: Number(this.idConvenio()),
    prefijo: this.prefijoConvenio().trim().toUpperCase(),
    cantidad: Number(this.numeroFolios()),
    vigencia: ''
  };

  this.cargando.set(true);
  this.mostrarNotificacion('Enviando petición para crear folios...', 'info');

  this.apiService.crearFolios(payload, this.token()).subscribe({
    next: (respuesta) => {
      this.cargando.set(false);
      console.log('Respuesta del servidor (folios):', respuesta);
      this.mostrarNotificacion('✅ Folios creados exitosamente.', 'success');
    },
    error: (error) => {
      this.cargando.set(false);
      console.error('Error al crear folios:', error);
      const mensaje = error?.error?.message
        || error?.message
        || 'Error desconocido al crear los folios.';
      this.mostrarNotificacion(`❌ ${mensaje}`, 'error');
    }
  });
}

  /**
   * Mostrar notificación temporal
   */
  private notificacionTimeout?: any;
  mostrarNotificacion(mensaje: string, tipo: 'info' | 'success' | 'error' = 'info'): void {
    this.mensajeEjecucion.set(mensaje);
    this.tipoMensaje.set(tipo);

    if (this.notificacionTimeout) {
      clearTimeout(this.notificacionTimeout);
    }
    this.notificacionTimeout = setTimeout(() => {
      this.mensajeEjecucion.set(null);
    }, 4500);
  }

  cerrarNotificacion(): void {
    this.mensajeEjecucion.set(null);
  }

  toggleResumen(): void {
    this.mostrarResumen.update(v => !v);
  }

  getTabButtonClass(tab: number): string {
    if (this.activeTab() === tab) {
      return 'bg-red-600 text-white shadow-md shadow-red-950/40';
    }
    return 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white';
  }

  getTabBadgeClass(tab: number): string {
    if (this.activeTab() === tab) {
      return 'bg-white text-red-700 font-bold';
    }
    return 'bg-neutral-700 text-neutral-200';
  }

  
}

