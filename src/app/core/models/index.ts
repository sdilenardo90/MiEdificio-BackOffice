export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CONDOMINIUM_ADMIN: 'CONDOMINIUM_ADMIN',
  BUILDING_ADMIN: 'BUILDING_ADMIN',
  RESIDENT: 'RESIDENT',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UnitRole = {
  OWNER: 'OWNER',
  TENANT: 'TENANT',
  FAMILY_MEMBER: 'FAMILY_MEMBER',
} as const;
export type UnitRole = (typeof UnitRole)[keyof typeof UnitRole];

export const ReservationStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];

export const AmenityScope = {
  GENERAL: 'GENERAL',
  MODULE_SPECIFIC: 'MODULE_SPECIFIC',
} as const;
export type AmenityScope = (typeof AmenityScope)[keyof typeof AmenityScope];

export const AnnouncementPriority = {
  NORMAL: 'NORMAL',
  URGENT: 'URGENT',
} as const;
export type AnnouncementPriority = (typeof AnnouncementPriority)[keyof typeof AnnouncementPriority];

// User DTOs
export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  consortiumId?: string | null;
  consortium?: ConsortiumDto | null;
  administeredBuildings?: { id: string; building?: { id: string; name: string }; name?: string }[];
  createdAt: string | Date;
  updatedAt?: string | Date;
}

// Consortium DTOs
export interface ConsortiumDto {
  id: string;
  name: string;
  address?: string | null;
  taxId?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  buildings?: BuildingDto[];
  admins?: UserDto[];
  _count?: {
    buildings: number;
    admins: number;
  };
}

export interface CreateConsortiumDto {
  name: string;
  address?: string;
  taxId?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateConsortiumDto {
  name?: string;
  address?: string;
  taxId?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface CreateConsortiumAdminDto {
  email: string;
  fullName: string;
  phone?: string;
  role?: UserRole;
  buildingIds?: string[];
}

export interface BuildingDto {
  id: string;
  consortiumId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
  consortium?: ConsortiumDto;
  modules?: BuildingModuleDto[];
  admins?: { id: string; userId: string; user?: UserDto }[];
  _count?: {
    units: number;
    amenities: number;
    admins?: number;
  };
}

export interface CreateBuildingDto {
  consortiumId: string;
  name: string;
  address: string;
  city?: string;
  country?: string;
  timezone?: string;
}

export interface AssignBuildingAdminDto {
  userId: string;
  buildingIds: string[];
}

export interface BuildingModuleDto {
  id: string;
  buildingId: string;
  name: string;
  description?: string | null;
  createdAt?: string | Date;
  _count?: {
    units?: number;
  };
}

export interface CreateBuildingModuleDto {
  name: string;
  description?: string;
}

export interface UnitDto {
  id: string;
  buildingId: string;
  moduleId?: string | null;
  code: string;
  floor?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  module?: BuildingModuleDto | null;
  _count?: {
    userUnits?: number;
    reservations?: number;
  };
}

export interface CreateUnitDto {
  code: string;
  floor?: string;
  moduleId?: string;
}

export interface UpdateUnitDto {
  code?: string;
  floor?: string;
  moduleId?: string | null;
}

export interface UserUnitDto {
  id: string;
  userId: string;
  unitId: string;
  role: string;
  isActive: boolean;
  unit?: UnitDto;
  building?: BuildingDto;
}

// Amenity DTOs
export interface AmenityDto {
  id: string;
  buildingId: string;
  moduleId?: string | null;
  name: string;
  description?: string;
  scope: AmenityScope;
  openingTime: string;
  closingTime: string;
  slotDurationMinutes: number;
  costPerSlot: number;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySlotDto {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  existingReservationId?: string;
  reasonUnavailable?: string;
}

// Reservation DTOs
export interface CreateReservationDto {
  amenityId: string;
  unitId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface UpdateReservationStatusDto {
  status: typeof ReservationStatus.APPROVED | typeof ReservationStatus.REJECTED;
  rejectionReason?: string;
}

export interface ReservationResponseDto {
  id: string;
  amenityId: string;
  unitId: string;
  userId: string;
  buildingId: string;
  startTime: string;
  endTime: string;
  cost: number;
  status: ReservationStatus;
  rejectionReason?: string | null;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  amenity?: AmenityDto;
  unit?: UnitDto;
}

// Announcement DTOs
export interface CreateAnnouncementDto {
  buildingId: string;
  moduleId?: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  sendPushNotification: boolean;
}

export interface AnnouncementDto {
  id: string;
  buildingId: string;
  moduleId?: string | null;
  authorUserId: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  publishedAt: string;
  createdAt: string;
}
