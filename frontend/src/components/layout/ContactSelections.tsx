//note : un-used
import { IconMessageCircle } from "@tabler/icons-react";

type Contact = {
    name: string;
    location: string;
    avatar: string;
  };

export default function ContactsSection({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="flex flex-col mt-4">
      <h3 className="mb-2 font-medium text-gray-500">Contacts</h3>
      <div className="flex flex-col space-y-3">
        {contacts.map((contact, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={contact.avatar} className="h-8 w-8 rounded-full" alt={contact.name} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{contact.name}</span>
                <span className="text-xs text-gray-500">{contact.location}</span>
              </div>
            </div>
            <button className="rounded-full p-1 hover:bg-gray-100">
              <IconMessageCircle className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        ))}
        <a href="#" className="mt-2 text-center text-sm text-blue-500 hover:underline">
          View All
        </a>
      </div>
    </div>
  );
}