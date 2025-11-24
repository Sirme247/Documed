export const VISIT_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed'
};

export const ROLE_IDS = {
  SYSTEM_ADMIN: 1,
  HOSPITAL_ADMIN: 2,
  DOCTOR: 3,
  NURSE: 4,
  RECEPTIONIST: 5
};

// Check if user can edit visit
export function canEditVisit(visit, userRoleId) {
  // Admins can always edit
  if (userRoleId <= 2) {
    return { allowed: true, reason: 'Admin access' };
  }

  // Only doctors (3) and nurses (4) can edit
  if (userRoleId !== ROLE_IDS.DOCTOR && userRoleId !== ROLE_IDS.NURSE) {
    return {
      allowed: false,
      reason: 'Only doctors and nurses can edit visits'
    };
  }

  // Cannot edit closed visits
  if (visit.visit_status === VISIT_STATUS.CLOSED) {
    return {
      allowed: false,
      reason: 'Cannot edit closed visits'
    };
  }

  return { allowed: true, reason: 'Visit is open' };
}

// Check if user can close visit
export function canCloseVisit(visit, userRoleId) {
  // Admins can always close
  if (userRoleId <= 2) {
    return { allowed: true, reason: 'Admin access' };
  }

  // Only receptionists (5) can close
  if (userRoleId !== ROLE_IDS.RECEPTIONIST) {
    return {
      allowed: false,
      reason: 'Only receptionists can close visits',
      userRole: getRoleNameByID(userRoleId)
    };
  }

  // Cannot close already closed visits
  if (visit.visit_status === VISIT_STATUS.CLOSED) {
    return {
      allowed: false,
      reason: 'Visit is already closed'
    };
  }

  return { allowed: true, reason: 'Visit can be closed' };
}

// Check if user can add records to visit
export function canAddRecordsToVisit(visit, userRoleId) {
  // Admins can always add
  if (userRoleId <= 2) {
    return { allowed: true };
  }

  // Only doctors and nurses can add records
  if (userRoleId !== ROLE_IDS.DOCTOR && userRoleId !== ROLE_IDS.NURSE) {
    return {
      allowed: false,
      reason: 'Only doctors and nurses can add records to visits'
    };
  }

  // Cannot add to closed visits
  if (visit.visit_status === VISIT_STATUS.CLOSED) {
    return {
      allowed: false,
      reason: 'Cannot add records to closed visits'
    };
  }

  return { allowed: true };
}

function getRoleNameByID(roleId) {
  const roles = {
    1: 'System Admin',
    2: 'Hospital Admin',
    3: 'Doctor',
    4: 'Nurse',
    5: 'Receptionist'
  };
  return roles[roleId] || 'Unknown';
}
