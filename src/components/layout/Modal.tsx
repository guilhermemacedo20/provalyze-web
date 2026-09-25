type ModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
};

export function Modal({
  isOpen,
  setIsOpen,
  title,
  description,
  onConfirm,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg relative"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="align-top absolute right-4 top-4 rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300 cursor-pointer"
        >
          X
        </button>
        <h2 className="mb-4 text-xl font-bold">{title}</h2>
        <p className="mb-6 text-gray-600">{description}</p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-red-600 px-4 py-2 text-white cursor-pointer"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
