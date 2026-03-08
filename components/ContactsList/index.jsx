import { useState, useEffect } from "react";
import { YStack, XStack, Button, Text, ScrollView, Spinner } from "tamagui";
import Image from "next/image";
import worldIcon from "../../public/worldIcon.svg";
import { getContacts, toggleContactFavorite, deleteContact } from "../../api/api";

export default function ContactsList({ filterBy = null, onContactSelect, selectedContact = null }) {
    const [contacts, setContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("recent");

    useEffect(() => {
        fetchContacts();
    }, [filterBy]);

    async function fetchContacts() {
        setContactsLoading(true);
        try {
            const { data } = await getContacts(filterBy);
            if (data && data.contacts) {
                setContacts(data.contacts);
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
        } finally {
            setContactsLoading(false);
        }
    }

    async function handleToggleFavorite(contactId, currentStatus) {
        try {
            const response = await toggleContactFavorite(contactId, !currentStatus);
            
            if (response.status === 200 && response.data) {
                // Update local state with server response
                setContacts(contacts.map(contact => 
                    contact.id === contactId 
                        ? { ...contact, is_favourite: !currentStatus }
                        : contact
                ));
            } else {
                alert("Failed to update favorite status. Please try again.");
                console.error("Failed to toggle favorite:", response);
            }
        } catch (error) {
            alert("An error occurred. Please try again.");
            console.error("Error toggling favorite:", error);
        }
    }

    async function handleDeleteContact(e, contactId) {
        e.stopPropagation();
        
        if (confirm("Are you sure you want to delete this contact?")) {
            try {
                const response = await deleteContact(contactId);
                
                if (response.status === 200) {
                    // Remove from local state
                    setContacts(contacts.filter(contact => contact.id !== contactId));
                } else if (response.status === 404) {
                    alert("Contact not found. It may have already been deleted.");
                    // Remove from local state since it's not on server
                    setContacts(contacts.filter(contact => contact.id !== contactId));
                } else {
                    alert("Failed to delete contact. Please try again.");
                    console.error("Failed to delete contact:", response);
                }
            } catch (error) {
                alert("An error occurred while deleting the contact. Please try again.");
                console.error("Error deleting contact:", error);
            }
        }
    }

    function getContactAddress(contact) {
        // Priority: bank_alias > wallet_address > name_label
        if (contact.bank_alias) {
            return contact.bank_alias;
        } else if (contact.wallet_address) {
            return contact.wallet_address;
        } else if (contact.name_label_id && contact.name_label) {
            return contact.name_label;
        }
        return "";
    }

    function getDisplayAddress(contact) {
        const address = getContactAddress(contact);
        
        // For long addresses, show truncated version
        if (address && address.length > 20 && !contact.bank_alias && !contact.name_label_id) {
            return address.slice(0, 10) + "..." + address.slice(-8);
        }
        
        return address;
    }

    function handleContactClick(contact) {
        if (onContactSelect) {
            // Pass the actual address that should be used
            const contactWithAddress = {
                ...contact,
                selectedAddress: getContactAddress(contact)
            };
            onContactSelect(contactWithAddress);
        }
    }

    const filteredContacts = activeTab === "favorite" 
        ? contacts.filter(c => c.is_favourite)
        : contacts;

    return (
        <YStack marginTop="$6">
            {/* Tab Headers */}
            <XStack width="100%" marginBottom="$3" borderBottomWidth={1} borderBottomColor="$neutral5">
                <Button
                    flex={1}
                    backgroundColor="transparent"
                    borderBottomWidth={3}
                    borderBottomColor={activeTab === "recent" ? "#FF1B90" : "transparent"}
                    borderRadius={0}
                    paddingVertical="$3"
                    marginBottom={-1}
                    onPress={() => setActiveTab("recent")}
                >
                    <Text 
                        fontSize="$6" 
                        fontWeight={activeTab === "recent" ? "700" : "400"}
                        color={activeTab === "recent" ? "$neutral13" : "$neutral10"}
                    >
                        Recent
                    </Text>
                </Button>
                <Button
                    flex={1}
                    backgroundColor="transparent"
                    borderBottomWidth={3}
                    borderBottomColor={activeTab === "favorite" ? "#FF1B90" : "transparent"}
                    borderRadius={0}
                    paddingVertical="$3"
                    marginBottom={-1}
                    onPress={() => setActiveTab("favorite")}
                >
                    <Text 
                        fontSize="$6" 
                        fontWeight={activeTab === "favorite" ? "700" : "400"}
                        color={activeTab === "favorite" ? "$neutral13" : "$neutral10"}
                    >
                        Favorite
                    </Text>
                </Button>
            </XStack>
            
            {/* Contact List */}
            <ScrollView maxHeight={225}>
                {contactsLoading ? (
                    <YStack alignItems="center" paddingVertical="$4">
                        <Spinner />
                    </YStack>
                ) : (
                    <YStack gap="$1">
                        {filteredContacts.length === 0 ? (
                            <Text color="$neutral10" textAlign="center" paddingVertical="$4">
                                {activeTab === "favorite" ? "No favorite contacts" : "No recent contacts"}
                            </Text>
                        ) : (
                            filteredContacts.map((contact) => (
                                <Button
                                    key={contact.id}
                                    backgroundColor={selectedContact?.id === contact.id ? "$neutral3" : "transparent"}
                                    borderWidth={0}
                                    paddingHorizontal="$3"
                                    paddingVertical="$2"
                                    onPress={() => handleContactClick(contact)}
                                    pressStyle={{ backgroundColor: "$neutral3" }}
                                >
                                    <XStack alignItems="center" justifyContent="space-between" width="100%">
                                        <XStack alignItems="center" gap="$3">
                                            <YStack 
                                                width={50} 
                                                height={50} 
                                                borderRadius="$10" 
                                                backgroundColor="$neutral3"
                                                alignItems="center"
                                                justifyContent="center"
                                            >
                                                <Image 
                                                    src={worldIcon} 
                                                    alt="World Icon" 
                                                    width={24} 
                                                    height={24}
                                                />
                                            </YStack>
                                            <YStack gap="$1" alignItems="flex-start">
                                                <Text color="$neutral13" fontWeight="700" fontSize="$5" textAlign="left">
                                                    {contact.name_label || "Unnamed"}
                                                </Text>
                                                <Text color="$neutral10" fontSize="$3" textAlign="left">
                                                    {getDisplayAddress(contact)}
                                                </Text>
                                            </YStack>
                                        </XStack>
                                        <XStack gap="$2">
                                            <Button
                                                size="$3"
                                                circular
                                                backgroundColor="transparent"
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleFavorite(contact.id, contact.is_favourite);
                                                }}
                                            >
                                                <Text fontSize="$6">{contact.is_favourite ? "✅" : "☑️"}</Text>
                                            </Button>
                                            <Button
                                                size="$3"
                                                circular
                                                backgroundColor="transparent"
                                                onPress={(e) => handleDeleteContact(e, contact.id)}
                                            >
                                                <Text fontSize="$5">❌</Text>
                                            </Button>
                                        </XStack>
                                    </XStack>
                                </Button>
                            ))
                        )}
                    </YStack>
                )}
            </ScrollView>
        </YStack>
    );
}