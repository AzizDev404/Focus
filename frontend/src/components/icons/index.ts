/**
 * Centralised icon barrel. Re-export only the icons we actually use so that
 * Vite tree-shakes lucide-react aggressively. All call-sites should import
 * from this file (not directly from lucide-react) to enforce consistency.
 */
export {
  // navigation
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  Minus,
  Plus,
  Menu,
  Search,
  Settings,
  LogOut,

  // account / social
  User,
  Users,
  Mail,
  MessageCircle,
  Bell,
  Crown,
  Trophy,
  Medal,
  Sparkles,
  Star,

  // focus / time
  Timer,
  Clock,
  Flame,
  Target,
  Zap,

  // shop / economy
  ShoppingBag,
  Coins,
  Gift,
  Tag,
  Lock,
  Unlock,
  FolderOpen,
  Calendar,
  LayoutGrid,
  LayoutList,

  // media / upload
  Camera,
  Image as ImageIcon,
  Upload,
  Pencil,
  Edit3,
  Trash2,
  RefreshCcw,
  Save,

  // misc
  Eye,
  EyeOff,
  Info,
  AlertCircle,
  Shield,
  Activity,
  TrendingUp,
  Send,
  HardDrive,
  Sticker,
  Smile,
  ArrowUp,
} from 'lucide-react'
