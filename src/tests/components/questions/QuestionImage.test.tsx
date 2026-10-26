import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuestionImage } from "@/components/questions/QuestionImage";

const getImage = vi.fn();

vi.mock("@/services/questions.service", () => ({
  questionsService: { getImage: (path: string) => getImage(path) },
}));

const dataUrl = "data:image/png";

describe("QuestionImage", () => {
  beforeEach(() => {
    getImage.mockReset();
  });

  it("não renderiza nada sem imagem", () => {
    const { container } = render(<QuestionImage src={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("busca a imagem enviada pela API e exibe a data URL", async () => {
    getImage.mockResolvedValue({ id: "img1", image: dataUrl });

    render(<QuestionImage src="/questions/images/img1" alt="enviada" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByAltText("enviada")).toHaveAttribute("src", dataUrl),
    );
    expect(getImage).toHaveBeenCalledWith("/questions/images/img1");
  });

  it("mostra aviso quando a imagem não carrega", async () => {
    getImage.mockRejectedValue(new Error("404"));

    render(<QuestionImage src="/questions/images/img1" />);

    expect(
      await screen.findByText("Não foi possível carregar a imagem."),
    ).toBeInTheDocument();
  });
});
