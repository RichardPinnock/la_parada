import { registerStockLocation } from '@/app/admin/warehouse/actions';
import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { toast } from 'sonner';

interface ModalStockLocationProps {
    onClose: () => void
    onSubmit: (data: { name: string; isActive: boolean }) => void
    initialData?: { id: string,  name: string; isActive: boolean } // <-- opcional
}

const ModalStockLocation: React.FC<ModalStockLocationProps> = ({
    onClose,
    onSubmit,
    initialData
}) => {

    const title = initialData?.id ? 'Editar Local' : 'Registrar Local'
    const [name, setName] = useState(initialData?.name || '')
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true)
    const [id, setId] = useState(initialData?.id || '')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({ name, isActive })
    }
    const registerLocation = async (e: React.FormEvent) => {
        
        e.preventDefault()
        try {
            const formData = new FormData(e.target as HTMLFormElement)
            await registerStockLocation(new FormData(e.target as HTMLFormElement))
            onClose() // Cerrar el modal después de guardar
        } catch (error) {
            console.log("Error al registrar la ubicación:", error)
            if (error instanceof Error) {
                toast.error(error.message || "Error al guardar el local");
            } else {
                toast.error("Error desconocido al guardar el local");
            }
        }
    }

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-blue-100">
                <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center"> { title } </h2>
                <form action={registerStockLocation} >
                    <input type="hidden" name="id" value={id} />
                    <div className="mb-5">
                        <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">
                            Nombre:
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                            required
                        />
                    </div>
                    <div className="mb-8 flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="mr-2 accent-blue-600"
                        />
                        <label htmlFor="isActive" className="text-gray-700 font-semibold">
                            Activo
                        </label>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-red-500 font-semibold transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}

export default ModalStockLocation