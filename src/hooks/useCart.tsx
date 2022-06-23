import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productSelected = cart.find(product => product.id === productId)

      if (!productSelected) {
        const response = await api.get(`/products/${productId}`)
        const { id, title, image, price } = response.data
        const newCartProduct = { id, title, image, price, amount: 1 }

        setCart([...cart, newCartProduct])

        localStorage.setItem("@RocketShoes:cart", JSON.stringify([...cart, newCartProduct]))

      } else {
        updateProductAmount({ productId: productSelected.id, amount: productSelected.amount + 1 })
      }

    } catch {

      toast.error('Erro na adição do produto');

    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productSelected = cart.find(product => product.id === productId)
      if (!productSelected) throw new Error()

      const newCart = cart.filter(product => product.id !== productSelected?.id)

      setCart(newCart)

      localStorage.setItem("@RocketShoes:cart", JSON.stringify([...newCart]))
    } catch {

      toast.error('Erro na remoção do produto');

    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    try {
      const actualCart = cart;
      const selectedProduct = actualCart.find(product => product.id === productId);
      if (!selectedProduct) {
        throw new Error();
      }

      if (amount > selectedProduct.amount) {
        const stock = await api.get<Stock>(`/stock/${productId}`);

        if (selectedProduct.amount + 1 > stock.data.amount) return toast.error("Quantidade solicitada fora de estoque");

        selectedProduct.amount += 1;

        setCart([...actualCart]);

        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...actualCart])
        )

      } else {
        if (selectedProduct.amount - 1 === 0) throw new Error();

        selectedProduct.amount -= 1;

        setCart([...actualCart]);

        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...actualCart])
        );

      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
