# LubriPlan Maintenance - Industrial Design System

Guía completa del sistema de diseño industrial implementado en LubriPlan Maintenance.

## 🎨 Principios de Diseño

### Valores Principales
- **Premium**: Diseño limpio y profesional
- **Industrial**: Inspirado en sistemas de control industrial
- **Consistente**: Componentes y estilos estandarizados
- **Accesible**: Legible y fácil de usar
- **Responsive**: Funciona en todos los tamaños de pantalla

## 🎯 Componentes Principales

### IndustrialDesignSystem.jsx

Biblioteca centralizada de componentes reutilizables:

```jsx
import {
  IndustrialCard,
  IndustrialButton,
  IndustrialInput,
  IndustrialSelect,
  IndustrialTextarea,
  IndustrialBadge,
  IndustrialTable,
  IndustrialModal,
  IndustrialStat,
} from '../design/IndustrialDesignSystem';
```

### Componentes por Tipo

#### Contenedores
```jsx
// Tarjeta básica
<IndustrialCard>
  Contenido
</IndustrialCard>

// Tarjeta elevada (con sombra)
<IndustrialCard elevated>
  Contenido destacado
</IndustrialCard>
```

#### Formularios
```jsx
// Input
<IndustrialInput
  label="Código"
  value={value}
  onChange={onChange}
  placeholder="EQ-001"
  required
  error={errors.code}
  icon={<Search size={18} />}
/>

// Select
<IndustrialSelect
  label="Criticidad"
  value={criticality}
  onChange={onChange}
  options={[
    { value: 'A', label: 'Crítica' },
    { value: 'B', label: 'Moderada' },
    { value: 'C', label: 'Baja' },
  ]}
  required
/>

// Textarea
<IndustrialTextarea
  label="Descripción"
  value={notes}
  onChange={onChange}
  rows={4}
/>
```

#### Botones
```jsx
// Variantes
<IndustrialButton variant="primary">Primario</IndustrialButton>
<IndustrialButton variant="secondary">Secundario</IndustrialButton>
<IndustrialButton variant="danger">Peligroso</IndustrialButton>
<IndustrialButton variant="success">Éxito</IndustrialButton>

// Tamaños
<IndustrialButton size="sm">Pequeño</IndustrialButton>
<IndustrialButton size="md">Medio</IndustrialButton>
<IndustrialButton size="lg">Grande</IndustrialButton>

// Con icono
<IndustrialButton icon={<Plus size={20} />}>
  Crear
</IndustrialButton>

// Deshabilitado
<IndustrialButton disabled>Deshabilitado</IndustrialButton>
```

#### Badgesy Etiquetas
```jsx
<IndustrialBadge
  label="Crítica"
  variant="danger"
  size="sm"
/>

// Variantes: success, warning, danger, info, default
// Tamaños: sm, md, lg
```

#### Estadísticas
```jsx
<IndustrialStat
  label="Órdenes Completadas"
  value={245}
  unit="órdenes"
  icon={<CheckCircle2 size={32} />}
  trend={12}  // % de cambio
/>
```

#### Modal
```jsx
<IndustrialModal
  isOpen={isOpen}
  title="Crear Activo"
  onClose={handleClose}
  footer={
    <>
      <IndustrialButton variant="secondary" onClick={handleClose}>
        Cancelar
      </IndustrialButton>
      <IndustrialButton variant="primary" onClick={handleSave}>
        Guardar
      </IndustrialButton>
    </>
  }
>
  {/* Contenido del modal */}
</IndustrialModal>
```

## 🎨 Paleta de Colores

### Colores Primarios
```javascript
--industrial-steel: #2C3E50      // Gris oscuro profesional
--industrial-aluminum: #34495E  // Gris secundario
--industrial-titanium: #546E7A  // Gris claro
```

### Colores de Acción
```javascript
--industrial-electric: #00BCD4  // Cyan (primario)
--industrial-warning: #FF9800   // Naranja
--industrial-danger: #E74C3C    // Rojo
--industrial-success: #27AE60   // Verde
```

## 📏 Espaciado

```javascript
// Variables CSS
--industrial-space-xs: 0.25rem    // 4px
--industrial-space-sm: 0.5rem     // 8px
--industrial-space-md: 1rem       // 16px
--industrial-space-lg: 1.5rem     // 24px
--industrial-space-xl: 2rem       // 32px
--industrial-space-2xl: 3rem      // 48px
```

## 📐 Patrón de Página de Listado

### Estructura Recomendada

```jsx
import { useState } from 'react';
import { IndustrialButton, IndustrialCard, IndustrialInput } from '../design/IndustrialDesignSystem';
import { Plus, Search } from 'lucide-react';

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Título</h1>
          <p className="text-gray-600 mt-1">Descripción</p>
        </div>
        <IndustrialButton
          variant="primary"
          size="lg"
          icon={<Plus size={20} />}
          onClick={() => setIsModalOpen(true)}
        >
          Crear
        </IndustrialButton>
      </div>

      {/* 2. Search & Filters */}
      <IndustrialInput
        placeholder="Buscar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={18} />}
      />

      <div className="flex gap-2">
        {['all', 'active', 'inactive'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full font-semibold text-sm ${
              filter === f
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {f === 'all' ? 'Todos' : f}
          </button>
        ))}
      </div>

      {/* 3. Items Grid/List */}
      <div className="grid gap-4">
        {filteredItems.length === 0 ? (
          <IndustrialCard elevated className="p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-bold text-gray-900">Sin elementos</h3>
          </IndustrialCard>
        ) : (
          filteredItems.map((item) => (
            <IndustrialCard key={item.id} elevated className="p-6">
              {/* Contenido del item */}
            </IndustrialCard>
          ))
        )}
      </div>

      {/* 4. Modal de Crear/Editar */}
      <ItemFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={editingItem}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          // Recargar items
        }}
      />
    </div>
  );
}
```

## 🎯 Checklist para Nuevas Páginas

- [ ] Importar sistema de diseño industrial
- [ ] Crear header con título y botón de acción
- [ ] Agregar búsqueda si aplica
- [ ] Agregar filtros si aplica
- [ ] Implementar tarjetas o tabla con contenido
- [ ] Estado vacío (empty state)
- [ ] Modal de crear/editar si aplica
- [ ] Estilos responsive
- [ ] Validación de formularios
- [ ] Mensajes de error y éxito (toast)

## 🚀 Ejemplos Implementados

### Páginas Completadas
1. **Assets** - Gestión de activos con CRUD
2. **WorkOrders** - Órdenes con filtros y búsqueda
3. **SpareParts** - Catálogo de refacciones
4. **Inventory** - Gestión de almacenes

### Patrones Usados
- Tarjetas elevadas con hover
- Badges de color para estados
- Búsqueda con ícono
- Filtros estilo pill
- Modales para formularios
- Estadísticas destacadas

## 📚 Archivos Principales

```
src/modules/maintenance/
├── design/
│   ├── IndustrialDesignSystem.jsx    # Componentes reutilizables
│   ├── industrial.css                # Estilos globales
│   └── DESIGN_GUIDE.md              # Esta guía
├── components/
│   ├── AssetFormModal.jsx           # Modal de crear/editar
│   ├── AssetsList.jsx               # Listado de activos
│   └── ListPageTemplate.jsx         # Template reutilizable
└── pages/
    ├── Assets.jsx                   # ✅ Implementada
    ├── WorkOrders.jsx               # ✅ Implementada
    ├── SpareParts.jsx               # ✅ Implementada
    ├── Inventory.jsx                # ✅ Implementada
    ├── FailureCodes.jsx             # TODO
    ├── PreventivePlans.jsx          # TODO
    └── ...
```

## 🔄 Migrando Páginas Existentes

1. Reemplazar imports antiguos
2. Aplicar estructura de header + search + filters
3. Usar IndustrialCard para contenido
4. Implementar estados vacíos
5. Agregar modales para CRUD si aplica
6. Probar en móvil

## 💡 Tips

- Usa `className="space-y-6"` para separación entre secciones
- Usa `className="grid gap-4"` para listas de items
- Siempre incluye estados vacíos con ícono y mensaje
- Los modales automáticamente cierran con la X
- Los botones con variant="primary" ya tienen gradient
- Los inputs muestran error en rojo automáticamente

## 📞 Soporte

Para preguntas o mejoras al sistema de diseño, consulta los componentes en:
- `src/modules/maintenance/design/IndustrialDesignSystem.jsx`
- `src/modules/maintenance/design/industrial.css`
