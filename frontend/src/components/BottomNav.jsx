import { NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, LayoutGrid, Heart, ShoppingCart, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { to: "/shop",    label: "Shop",       Icon: ShoppingBag },
  { to: "/catalog", label: "Collection", Icon: LayoutGrid  },
  { to: "/wishlist",label: "Wishlist",   Icon: Heart       },
  { to: "/cart",    label: "Cart",       Icon: ShoppingCart },
  { to: "/account", label: "Account",   Icon: User        },
];

export default function BottomNav() {
  const { cartCount }     = useCart();
  const { wishlistCount } = useWishlist();
  const { customer }      = useAuth();

  const counts = { "/wishlist": wishlistCount, "/cart": cartCount };

  return (
    <nav className="bottom-nav">
      {TABS.map(({ to, label, Icon }) => {
        const count = counts[to] ?? 0;
        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => "bottom-nav-tab" + (isActive ? " active" : "")}
          >
            <span className="bottom-nav-icon-wrap">
              <Icon size={22} strokeWidth={1.8} />
              {count > 0 && (
                <span className="bottom-nav-badge">{count > 9 ? "9+" : count}</span>
              )}
            </span>
            <span className="bottom-nav-label">
              {label === "Account" && customer ? customer.name.split(" ")[0] : label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
