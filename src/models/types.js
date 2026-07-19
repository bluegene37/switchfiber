/**
 * @typedef {Object} CreateApplicationRequest
 * @property {string} timestamp
 * @property {string} emailAddress
 * @property {string} region
 * @property {string} city
 * @property {string} barangay
 * @property {string} referredBy
 * @property {string} firstName
 * @property {string} middleName
 * @property {string} lastName
 * @property {string} mobileNumber
 * @property {string} secondaryMobileNumber
 * @property {string} installationAddress
 * @property {string} landmark
 * @property {string} desiredPlan
 * @property {string} proofOfBilling
 * @property {string} governmentValidId
 * @property {string} secondGovernmentValidId
 * @property {string} houseFrontPicture
 * @property {string} termsAndConditionsAgreement
 * @property {string} firstNearestLandmark
 * @property {string} secondNearestLandmark
 * @property {string} applicablePromo
 * @property {string} documentPicture
 * @property {string} referrersAccountNumber
 * @property {string} applyingFor
 * @property {string} status
 * @property {string} visitBy
 * @property {string} visitWith
 * @property {string} visitWithOther
 * @property {string} remarks
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} userEmail
 */

/**
 * @typedef {Object} CreateBillingDetailsRequest
 * @property {integer|string} accountNo
 * @property {string} dateInstalled
 * @property {string} fullName
 * @property {string} contactNumber
 * @property {string} emailAddress
 * @property {string} address
 * @property {string} location
 * @property {string} plan
 * @property {string} provider
 * @property {number|string} accountBalance
 * @property {string} balanceUpdateDate
 * @property {string} username
 * @property {string} connectionType
 * @property {string} routerModemSn
 * @property {string} ip
 * @property {string} lcp
 * @property {string} nap
 * @property {string} port
 * @property {string} vlan
 * @property {string} lcpNap
 * @property {string} status
 * @property {string} group
 * @property {integer|string} splynxId
 * @property {integer|string} mikrotikId
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} userEmail
 * @property {integer|string} billingDay
 * @property {string} billingStatus
 * @property {string} deliveryStatus
 * @property {string} routerModel
 * @property {string} barangay
 * @property {string} city
 * @property {string} region
 * @property {string} lcpNapPort
 * @property {string} usageType
 * @property {string} renter
 * @property {string} attachment1
 * @property {string} attachment2
 * @property {string} attachment3
 * @property {string} referredBy
 * @property {string} secondContactNumber
 * @property {string} addressCoordinates
 * @property {string} referrersAccountNumber
 */

/**
 * @typedef {Object} CreateJobOrderRequest
 * @property {string} emailAddress
 * @property {string} referredBy
 * @property {string} firstName
 * @property {string} middleInitial
 * @property {string} lastName
 * @property {string} contactNumber
 * @property {string} applicantEmailAddress
 * @property {string} address
 * @property {string} location
 * @property {string} barangay
 * @property {string} city
 * @property {string} region
 * @property {integer|string} planId
 * @property {string} remarks
 * @property {string} installationFee
 * @property {string} contractTemplate
 * @property {string} billingDay
 * @property {string} preferredDay
 * @property {string} joRemarks
 * @property {string} status
 * @property {string} verifiedBy
 * @property {string} modemRouterSN
 * @property {string} provider
 * @property {integer|string} lcpId
 * @property {integer|string} napId
 * @property {string} portId
 * @property {integer|string} vlanId
 * @property {string} username
 * @property {string} visitBy
 * @property {string} visitWith
 * @property {string} visitWithOther
 * @property {string} onsiteStatus
 * @property {string} onsiteRemarks
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} contractLink
 * @property {string} connectionType
 * @property {string} assignedEmail
 * @property {string} setupImage
 * @property {string} speedtestImage
 * @property {string} startTimeStamp
 * @property {string} endTimeStamp
 * @property {string} duration
 * @property {string} externalId
 * @property {string} lcpnapId
 * @property {string} billingStatus
 * @property {string} routerModel
 * @property {string} dateInstalled
 * @property {string} clientSignature
 * @property {string} ip
 * @property {string} signedContractImage
 * @property {string} boxReadingImage
 * @property {string} routerReadingImage
 * @property {string} usernameStatus
 * @property {string} lcpnapportId
 * @property {string} itemName1
 * @property {string} itemQuantity1
 * @property {string} itemName2
 * @property {string} itemQuantity2
 * @property {string} itemName3
 * @property {string} itemQuantity3
 * @property {string} itemName4
 * @property {string} itemQuantity4
 * @property {string} itemName5
 * @property {string} itemQuantity5
 * @property {string} itemName6
 * @property {string} itemQuantity6
 * @property {string} itemName7
 * @property {string} itemQuantity7
 * @property {string} itemName8
 * @property {string} itemQuantity8
 * @property {string} itemName9
 * @property {string} itemQuantity9
 * @property {string} itemName10
 * @property {string} itemQuantity10
 * @property {string} usageType
 * @property {string} renter
 * @property {string} installationLandmark
 * @property {string} statusRemarks
 * @property {string} portLabelImage
 * @property {string} secondContactNumber
 * @property {string} accountNo
 * @property {string} addressCoordinates
 * @property {string} referrersAccountNumber
 * @property {string} applicationId
 * @property {string} houseFront
 */

/**
 * @typedef {Object} CreateLcpnapportRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreateLcpnapRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreateLcpRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreateNapRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreatePlanRequest
 * @property {string} name
 * @property {string} description
 * @property {number|string} amount
 * @property {integer|string} discountId
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreatePortsRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreateRouterRequest
 * @property {string} name
 * @property {string} description
 * @property {string} brand
 * @property {string} model
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} CreateVlanRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} createdBy
 * @property {string} createdDate
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateApplicationRequest
 * @property {string} emailAddress
 * @property {string} region
 * @property {string} city
 * @property {string} barangay
 * @property {string} referredBy
 * @property {string} firstName
 * @property {string} middleName
 * @property {string} lastName
 * @property {string} mobileNumber
 * @property {string} secondaryMobileNumber
 * @property {string} installationAddress
 * @property {string} landmark
 * @property {string} desiredPlan
 * @property {string} proofOfBilling
 * @property {string} governmentValidId
 * @property {string} secondGovernmentValidId
 * @property {string} houseFrontPicture
 * @property {string} termsAndConditionsAgreement
 * @property {string} firstNearestLandmark
 * @property {string} secondNearestLandmark
 * @property {string} applicablePromo
 * @property {string} documentPicture
 * @property {string} referrersAccountNumber
 * @property {string} applyingFor
 * @property {string} status
 * @property {string} visitBy
 * @property {string} visitWith
 * @property {string} visitWithOther
 * @property {string} remarks
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} userEmail
 */

/**
 * @typedef {Object} UpdateBillingDetailsRequest
 * @property {integer|string} accountNo
 * @property {string} dateInstalled
 * @property {string} fullName
 * @property {string} contactNumber
 * @property {string} emailAddress
 * @property {string} address
 * @property {string} location
 * @property {string} plan
 * @property {string} provider
 * @property {number|string} accountBalance
 * @property {string} balanceUpdateDate
 * @property {string} username
 * @property {string} connectionType
 * @property {string} routerModemSn
 * @property {string} ip
 * @property {string} lcp
 * @property {string} nap
 * @property {string} port
 * @property {string} vlan
 * @property {string} lcpNap
 * @property {string} status
 * @property {string} group
 * @property {integer|string} splynxId
 * @property {integer|string} mikrotikId
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} userEmail
 * @property {integer|string} billingDay
 * @property {string} billingStatus
 * @property {string} deliveryStatus
 * @property {string} routerModel
 * @property {string} barangay
 * @property {string} city
 * @property {string} region
 * @property {string} lcpNapPort
 * @property {string} usageType
 * @property {string} renter
 * @property {string} attachment1
 * @property {string} attachment2
 * @property {string} attachment3
 * @property {string} referredBy
 * @property {string} secondContactNumber
 * @property {string} addressCoordinates
 * @property {string} referrersAccountNumber
 */

/**
 * @typedef {Object} UpdateJobOrderRequest
 * @property {string} emailAddress
 * @property {string} referredBy
 * @property {string} firstName
 * @property {string} middleInitial
 * @property {string} lastName
 * @property {string} contactNumber
 * @property {string} applicantEmailAddress
 * @property {string} address
 * @property {string} location
 * @property {string} barangay
 * @property {string} city
 * @property {string} region
 * @property {integer|string} planId
 * @property {string} remarks
 * @property {string} installationFee
 * @property {string} contractTemplate
 * @property {string} billingDay
 * @property {string} preferredDay
 * @property {string} joRemarks
 * @property {string} status
 * @property {string} verifiedBy
 * @property {string} modemRouterSN
 * @property {string} provider
 * @property {integer|string} lcpId
 * @property {integer|string} napId
 * @property {string} portId
 * @property {integer|string} vlanId
 * @property {string} username
 * @property {string} visitBy
 * @property {string} visitWith
 * @property {string} visitWithOther
 * @property {string} onsiteStatus
 * @property {string} onsiteRemarks
 * @property {string} modifiedBy
 * @property {string} modifiedDate
 * @property {string} contractLink
 * @property {string} connectionType
 * @property {string} assignedEmail
 * @property {string} setupImage
 * @property {string} speedtestImage
 * @property {string} startTimeStamp
 * @property {string} endTimeStamp
 * @property {string} duration
 * @property {string} externalId
 * @property {string} lcpnapId
 * @property {string} billingStatus
 * @property {string} routerModel
 * @property {string} dateInstalled
 * @property {string} clientSignature
 * @property {string} ip
 * @property {string} signedContractImage
 * @property {string} boxReadingImage
 * @property {string} routerReadingImage
 * @property {string} usernameStatus
 * @property {string} lcpnapportId
 * @property {string} itemName1
 * @property {string} itemQuantity1
 * @property {string} itemName2
 * @property {string} itemQuantity2
 * @property {string} itemName3
 * @property {string} itemQuantity3
 * @property {string} itemName4
 * @property {string} itemQuantity4
 * @property {string} itemName5
 * @property {string} itemQuantity5
 * @property {string} itemName6
 * @property {string} itemQuantity6
 * @property {string} itemName7
 * @property {string} itemQuantity7
 * @property {string} itemName8
 * @property {string} itemQuantity8
 * @property {string} itemName9
 * @property {string} itemQuantity9
 * @property {string} itemName10
 * @property {string} itemQuantity10
 * @property {string} usageType
 * @property {string} renter
 * @property {string} installationLandmark
 * @property {string} statusRemarks
 * @property {string} portLabelImage
 * @property {string} secondContactNumber
 * @property {string} accountNo
 * @property {string} addressCoordinates
 * @property {string} referrersAccountNumber
 * @property {string} applicationId
 * @property {string} houseFront
 */

/**
 * @typedef {Object} UpdateLcpnapportRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateLcpnapRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateLcpRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateNapRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdatePlanRequest
 * @property {string} name
 * @property {string} description
 * @property {number|string} amount
 * @property {integer|string} discountId
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdatePortRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateRouterRequest
 * @property {string} name
 * @property {string} description
 * @property {string} brand
 * @property {string} model
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */

/**
 * @typedef {Object} UpdateVlanRequest
 * @property {string} name
 * @property {string} description
 * @property {integer|string} modifiedBy
 * @property {string} modifiedDate
 */
